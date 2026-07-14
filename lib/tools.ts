/**
 * TeleBotHost MCP — Tool definitions.
 *
 * 46 tools across 8 groups:
 *   Health · Public Discovery · Bot Lifecycle · Bot Storage ·
 *   Broadcasts · Commands · Community Store · Quota
 *
 * Each tool maps 1:1 to a TBH Developer API endpoint.
 * Mutating tools (POST/PATCH/PUT/DELETE) require an sk_* key.
 */

import type { ToolDef, ToolResult, TbhClientLike } from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrap any JSON-serialisable value as a successful text tool result. */
function json(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

/** Extract a typed field from the args object. */
function arg<T>(args: Record<string, unknown>, key: string): T {
  return args[key] as T;
}

// ===========================================================================
// 1. HEALTH  (1 tool)
// ===========================================================================

const healthTools: ToolDef[] = [
  {
    name: "telebothost_get_status",
    description:
      "Get TeleBotHost API health and status. Returns version, health status, and active environment. No authentication required.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async (_args, c) => json((await c.get("/status")).data),
  },
];

// ===========================================================================
// 2. PUBLIC DISCOVERY  (8 tools, no auth required)
// ===========================================================================

const publicTools: ToolDef[] = [
  {
    name: "telebothost_get_public_user",
    description:
      "Get a user's public profile (fullname, username, location, bio, avatar). No authentication required.",
    inputSchema: {
      type: "object",
      properties: { username: { type: "string", description: "The user's public username." } },
      required: ["username"],
    },
    handler: async (a, c) => json((await c.get(`/public/user/${arg(a, "username")}`)).data),
  },
  {
    name: "telebothost_list_public_user_bots",
    description:
      "List a user's published bots (bot templates + community store listings). Each item includes listing_type to distinguish them. No authentication required.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The owner's username." },
        page: { type: "string", description: "Page number (default 1)." },
        limit: { type: "string", description: "Results per page." },
        listing_type: {
          type: "string",
          enum: ["bot_template", "community_store"],
          description: "Filter: bot_template (shareable blueprint) or community_store (store listing).",
        },
      },
      required: ["username"],
    },
    handler: async (a, c) =>
      json(
        (
          await c.get(`/public/user/${arg(a, "username")}/bots`, {
            page: a.page,
            limit: a.limit,
            listing_type: a.listing_type,
          })
        ).data,
      ),
  },
  {
    name: "telebothost_get_public_user_bot",
    description:
      "Get full details for one published bot by its Telegram username. Includes description, README, commands, and env placeholders. No authentication required.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "The owner's username." },
        botUsername: { type: "string", description: "Telegram bot username without @." },
      },
      required: ["username", "botUsername"],
    },
    handler: async (a, c) =>
      json(
        (await c.get(`/public/user/${arg(a, "username")}/bots/${arg(a, "botUsername")}`)).data,
      ),
  },
  {
    name: "telebothost_get_public_user_bot_readme",
    description:
      "Get only the description and README markdown for a published bot. No authentication required.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string" },
        botUsername: { type: "string", description: "Telegram bot username without @." },
      },
      required: ["username", "botUsername"],
    },
    handler: async (a, c) =>
      json(
        (
          await c.get(
            `/public/user/${arg(a, "username")}/bots/${arg(a, "botUsername")}/readme`,
          )
        ).data,
      ),
  },
  {
    name: "telebothost_list_templates",
    description:
      "Browse shareable bot blueprints (listing_type: bot_template). No authentication required.",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "string" },
        limit: { type: "string" },
        search: { type: "string", description: "Search term for template name or description." },
      },
    },
    handler: async (a, c) =>
      json((await c.get("/public/templates", { page: a.page, limit: a.limit, search: a.search })).data),
  },
  {
    name: "telebothost_get_template",
    description:
      "Get one shareable bot template by ID, including description, README, commands, and env placeholders. No authentication required.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.get(`/public/templates/${arg(a, "botid")}`)).data),
  },
  {
    name: "telebothost_get_template_readme",
    description:
      "Get the public description and README markdown for a template bot. No authentication required.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID." } },
      required: ["botid"],
    },
    handler: async (a, c) =>
      json((await c.get(`/public/templates/${arg(a, "botid")}/readme`)).data),
  },
  {
    name: "telebothost_list_public_store_bots",
    description:
      "Browse the community bot store (public). Same data as the authenticated store list but requires no login. No authentication required.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string" },
        search: { type: "string", description: "Search name, description, username, or tags (2-64 chars)." },
        page: { type: "string" },
        limit: { type: "string", description: "Max 50." },
      },
    },
    handler: async (a, c) =>
      json(
        (await c.get("/public/store/bots", {
          category: a.category,
          search: a.search,
          page: a.page,
          limit: a.limit,
        })).data,
      ),
  },
  {
    name: "telebothost_get_public_store_bot",
    description:
      "Get one community store listing by its store meta ID. No authentication required.",
    inputSchema: {
      type: "object",
      properties: { botMetaId: { type: "string", description: "The store listing _id." } },
      required: ["botMetaId"],
    },
    handler: async (a, c) => json((await c.get(`/public/store/bots/${arg(a, "botMetaId")}`)).data),
  },
];

// ===========================================================================
// 3. BOT LIFECYCLE  (18 tools, auth required)
// ===========================================================================

const botTools: ToolDef[] = [
  {
    name: "telebothost_list_bots",
    description:
      "List all bots belonging to the authenticated user, with statistics. Requires API key.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async (_a, c) => json((await c.get("/bot")).data),
  },
  {
    name: "telebothost_register_bot",
    description:
      "Register a new bot under your account. Requires sk_* (write) key. Subject to plan-based creation rate limits (e.g. 1 request per 5 min on FREE).",
    inputSchema: {
      type: "object",
      properties: {
        bot_token: { type: "string", description: "Telegram bot token from @BotFather, e.g. 123456789:ABCdef..." },
        bot_name: { type: "string", description: "Optional bot name. Defaults to the Telegram bot first name." },
        run_now: { type: "boolean", description: "Whether to start the bot immediately.", default: false },
      },
      required: ["bot_token"],
    },
    handler: async (a, c) =>
      json(
        (
          await c.post("/bot", {
            bot_token: arg(a, "bot_token"),
            bot_name: a.bot_name,
            run_now: a.run_now,
          })
        ).data,
      ),
  },
  {
    name: "telebothost_delete_bots",
    description:
      "Soft-delete one or more bots (moved to 10-day backup during which they can be recovered). Requires sk_* key.",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "integer" },
          description: "A single bot ID or an array of bot IDs to delete.",
        },
      },
      required: ["ids"],
    },
    handler: async (a, c) => json((await c.delete("/bot", { ids: arg(a, "ids") })).data),
  },
  {
    name: "telebothost_list_deleted_bots",
    description: "List all soft-deleted bots in your 10-day backup window.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async (_a, c) => json((await c.get("/bot/deleted")).data),
  },
  {
    name: "telebothost_recover_deleted_bot",
    description:
      "Restore a soft-deleted bot from backup. The bot is recovered with status 0 (disabled) for safety.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID to recover." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.post(`/bot/deleted/${arg(a, "botid")}/recover`)).data),
  },
  {
    name: "telebothost_purge_deleted_bot",
    description:
      "Permanently delete a soft-deleted bot and all associated logs, users, and session records from backup. Irreversible.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID to permanently delete." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.delete(`/bot/deleted/${arg(a, "botid")}/permanent`)).data),
  },
  {
    name: "telebothost_pin_bots",
    description: "Pin or unpin one or more bots. Requires sk_* key.",
    inputSchema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "integer" }, description: "Bot ID(s) to pin/unpin." },
        pin: { type: "boolean", description: "True to pin, false to unpin." },
      },
      required: ["ids", "pin"],
    },
    handler: async (a, c) => json((await c.patch("/bot/pin", { ids: arg(a, "ids"), pin: arg(a, "pin") })).data),
  },
  {
    name: "telebothost_get_bot",
    description: "Get detailed profile of a specific bot by ID.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.get(`/bot/${arg(a, "botid")}`)).data),
  },
  {
    name: "telebothost_update_bot",
    description: "Update bot configuration (name, token, pin, status). Requires sk_* key.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string", description: "The numeric bot ID." },
        name: { type: "string" },
        bot_token: { type: "string" },
        pin: { type: "boolean" },
        status: { type: "integer", description: "0 = disabled, 1 = enabled." },
      },
      required: ["botid"],
    },
    handler: async (a, c) => {
      const { botid, ...body } = a;
      void botid;
      return json((await c.patch(`/bot/${arg(a, "botid")}`, body)).data);
    },
  },
  {
    name: "telebothost_export_bot",
    description:
      "Generate a temporary JWT token and download URL for exporting a bot configuration as ZIP (bot.yaml, .env, commands/). The URL is time-limited.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.get(`/bot/${arg(a, "botid")}/export`)).data),
  },
  {
    name: "telebothost_clone_bot",
    description:
      "Clone an owned bot or a public template bot under your account. Subject to cloning rate limits (1/sec, 5/min, 20/hr). Requires sk_* key.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID to clone." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.post(`/bot/${arg(a, "botid")}/clone`)).data),
  },
  {
    name: "telebothost_clone_bot_as_child",
    description:
      "Clone a bot as a child bot. Child bots dynamically inherit environment variables and commands/folders from the parent without copying. Requires sk_* key. Subject to cloning rate limits.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric parent bot ID." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.post(`/bot/${arg(a, "botid")}/clone-child`)).data),
  },
  {
    name: "telebothost_list_bot_children",
    description: "List all child bots registered under the specified parent bot.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric parent bot ID." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.get(`/bot/${arg(a, "botid")}/children`)).data),
  },
  {
    name: "telebothost_transfer_bot",
    description:
      "Transfer a bot to another user (by email or user ID). The bot is actually cloned into the target's account with blank credentials and reset env vars; the original is preserved.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string", description: "The numeric bot ID." },
        target: { type: "string", description: "The target user's email or user ID." },
      },
      required: ["botid", "target"],
    },
    handler: async (a, c) =>
      json((await c.post(`/bot/${arg(a, "botid")}/transfer`, { target: arg(a, "target") })).data),
  },
  {
    name: "telebothost_reset_bot",
    description: "Reset bot logs, sessions, and flag all bot users as just-created. Requires sk_* key.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.post(`/bot/${arg(a, "botid")}/reset`)).data),
  },
  {
    name: "telebothost_toggle_bot_template",
    description: "Toggle the is_template flag for a bot. Templates can be shared publicly and cloned by others.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string", description: "The numeric bot ID." },
        is_template: { type: "boolean", description: "True to mark as template, false to unmark." },
      },
      required: ["botid", "is_template"],
    },
    handler: async (a, c) =>
      json(
        (
          await c.patch(`/bot/${arg(a, "botid")}/template`, {
            is_template: arg(a, "is_template"),
          })
        ).data,
      ),
  },
  {
    name: "telebothost_get_bot_readme",
    description: "Get the description and README markdown for a bot (owner-only).",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.get(`/bot/${arg(a, "botid")}/readme`)).data),
  },
  {
    name: "telebothost_update_bot_readme",
    description:
      "Update bot description and README markdown. Only allowed if the bot is marked as a template. Description max 500 chars, README max 50000 chars.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string", description: "The numeric bot ID." },
        description: { type: "string", description: "Short description (max 500 chars)." },
        readme: { type: "string", description: "README markdown (max 50000 chars)." },
      },
      required: ["botid"],
    },
    handler: async (a, c) => {
      const { botid, ...body } = a;
      void botid;
      return json((await c.put(`/bot/${arg(a, "botid")}/readme`, body)).data);
    },
  },
];

// ===========================================================================
// 4. BOT STORAGE  (4 tools, auth required)
// ===========================================================================

const storageTools: ToolDef[] = [
  {
    name: "telebothost_get_bot_storage_stats",
    description: "Get sync and async storage size and key metrics for a bot and its users.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string", description: "The numeric bot ID." },
        refresh: { type: "boolean", description: "Bypass cache if true." },
      },
      required: ["botid"],
    },
    handler: async (a, c) =>
      json((await c.get(`/bot/${arg(a, "botid")}/storage/stats`, { refresh: a.refresh })).data),
  },
  {
    name: "telebothost_get_bot_storage_keys",
    description: "List bot storage keys (without values) for sync and async storage.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string", description: "The numeric bot ID." },
        refresh: { type: "boolean", description: "Bypass cache if true." },
      },
      required: ["botid"],
    },
    handler: async (a, c) =>
      json((await c.get(`/bot/${arg(a, "botid")}/storage/data`, { refresh: a.refresh })).data),
  },
  {
    name: "telebothost_clear_bot_storage",
    description:
      "Permanently delete all sync and async props for the bot and its user props. Irreversible. Requires sk_* key.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.delete(`/bot/${arg(a, "botid")}/storage/data`)).data),
  },
  {
    name: "telebothost_migrate_bot_storage",
    description:
      "Migrate sync Bot.setProp data to async db.xx storage. Supports dry-run preview. Options: scope (bot|user|both), dryRun, overwrite, deleteSource.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string", description: "The numeric bot ID." },
        scope: { type: "string", enum: ["bot", "user", "both"], default: "both" },
        dryRun: { type: "boolean", default: false, description: "Preview without making changes." },
        overwrite: { type: "boolean", default: false },
        deleteSource: { type: "boolean", default: false, description: "Delete source data after migration." },
      },
      required: ["botid"],
    },
    handler: async (a, c) => {
      const { botid, ...body } = a;
      void botid;
      return json((await c.post(`/bot/${arg(a, "botid")}/storage/migrate`, body)).data);
    },
  },
];

// ===========================================================================
// 5. BROADCASTS  (6 tools, auth required)
// ===========================================================================

const broadcastTools: ToolDef[] = [
  {
    name: "telebothost_start_broadcast",
    description:
      "Start a broadcast job that sends a message to all bot subscribers matching the given filters. ⚠️ This sends real Telegram messages to many users — use with caution.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string", description: "The numeric bot ID." },
        method: { type: "string", description: "Telegram API method, e.g. sendMessage.", default: "sendMessage" },
        body: {
          type: "object",
          properties: { text: { type: "string", description: "Message text to broadcast." } },
          description: "Message body sent to each subscriber.",
        },
        filters: {
          type: "object",
          properties: {
            chatType: {
              oneOf: [
                { type: "string", enum: ["all", "private", "group", "channel"] },
                { type: "array", items: { type: "string", enum: ["all", "private", "group", "channel"] } },
              ],
              description: "Target specific chat types.",
            },
            premiumOnly: { type: "boolean", description: "Only send to Telegram Premium subscribers." },
          },
        },
        confirm: {
          type: "boolean",
          description: "Must be true to actually send. Safety gate to prevent accidental broadcasts.",
        },
      },
      required: ["botid", "body", "confirm"],
    },
    handler: async (a, c) => {
      if (!a.confirm) {
        return {
          content: [
            {
              type: "text",
              text: "Broadcast not sent: set confirm=true to actually send messages to all subscribers.",
            },
          ],
          isError: true,
        };
      }
      const { botid, confirm, ...body } = a;
      void botid;
      void confirm;
      return json((await c.post(`/bot/${arg(a, "botid")}/broadcast`, body)).data);
    },
  },
  {
    name: "telebothost_get_broadcast_stats",
    description: "Get real-time progress metrics and status of a broadcast job.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string" },
        broadcastId: { type: "string", description: "The broadcast job ID." },
      },
      required: ["botid", "broadcastId"],
    },
    handler: async (a, c) =>
      json(
        (await c.get(`/bot/${arg(a, "botid")}/broadcast/stats/${arg(a, "broadcastId")}`)).data,
      ),
  },
  {
    name: "telebothost_stop_broadcast",
    description: "Stop an actively processing broadcast job immediately.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string" },
        broadcastId: { type: "string" },
      },
      required: ["botid", "broadcastId"],
    },
    handler: async (a, c) =>
      json((await c.post(`/bot/${arg(a, "botid")}/broadcast/stop/${arg(a, "broadcastId")}`)).data),
  },
  {
    name: "telebothost_modify_broadcast",
    description: "Modify the message body for pending batches of an active broadcast mid-run.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string" },
        broadcastId: { type: "string" },
        body: {
          type: "object",
          properties: { text: { type: "string" } },
          description: "Updated message body.",
        },
      },
      required: ["botid", "broadcastId", "body"],
    },
    handler: async (a, c) =>
      json(
        (
          await c.put(`/bot/${arg(a, "botid")}/broadcast/modify/${arg(a, "broadcastId")}`, {
            body: a.body,
          })
        ).data,
      ),
  },
  {
    name: "telebothost_delete_broadcast",
    description: "Delete a completed or stopped broadcast tracking record and clean Redis keys.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string" },
        broadcastId: { type: "string" },
      },
      required: ["botid", "broadcastId"],
    },
    handler: async (a, c) =>
      json(
        (await c.delete(`/bot/${arg(a, "botid")}/broadcast/delete/${arg(a, "broadcastId")}`)).data,
      ),
  },
  {
    name: "telebothost_list_broadcasts",
    description: "List all broadcasts queued or run for a specific bot. Optional status filter.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string" },
        status: {
          type: "string",
          description: "Comma-separated statuses: pending,processing,completed,failed,stopped",
        },
        all: { type: "string", description: "Set to 'true' to retrieve broadcasts across all statuses." },
      },
      required: ["botid"],
    },
    handler: async (a, c) =>
      json(
        (await c.get(`/bot/${arg(a, "botid")}/broadcast/list`, { status: a.status, all: a.all })).data,
      ),
  },
];

// ===========================================================================
// 6. COMMANDS  (5 tools, auth required)
// ===========================================================================

const commandTools: ToolDef[] = [
  {
    name: "telebothost_list_commands",
    description: "List all commands and command folders registered for a bot.",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.get(`/bot/${arg(a, "botid")}/commands`)).data),
  },
  {
    name: "telebothost_create_command",
    description:
      "Create a new bot command. Subject to creation rate limits (10/sec, 30/min, 200/hr) and bot capacity cap (1000 commands, 10MB total).",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string", description: "The numeric bot ID." },
        name: { type: "string", description: "Command trigger, e.g. /start" },
        code: { type: "string", description: "JavaScript code (max 100K chars).", default: "" },
        answer: { type: "string", description: "Static reply text (max 10K chars).", default: "" },
        parse_mode: { type: "string", description: "Telegram parse mode: Markdown, HTML, etc." },
        keyboard: { type: "string", description: "Keyboard identifier, e.g. main_menu" },
        aliases: { type: "array", items: { type: "string" }, description: "Alternative triggers." },
        allow_only_group: { type: "boolean", default: false },
        need_reply: { type: "boolean", default: false },
        is_web: { type: "integer", minimum: 0, maximum: 1, default: 0 },
        folder: { type: "string", description: "Optional folder name (must exist).", nullable: true },
      },
      required: ["botid", "name"],
    },
    handler: async (a, c) => {
      const { botid, ...body } = a;
      void botid;
      return json((await c.post(`/bot/${arg(a, "botid")}/commands`, body)).data);
    },
  },
  {
    name: "telebothost_delete_commands",
    description: "Delete one or more commands from a bot in a single batch operation.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string", description: "The numeric bot ID." },
        ids: { type: "array", items: { type: "integer" }, description: "Array of command database IDs to delete." },
      },
      required: ["botid", "ids"],
    },
    handler: async (a, c) =>
      json((await c.delete(`/bot/${arg(a, "botid")}/commands`, { ids: arg(a, "ids") })).data),
  },
  {
    name: "telebothost_list_deleted_commands",
    description: "List all soft-deleted commands for a bot (recoverable for 7 days).",
    inputSchema: {
      type: "object",
      properties: { botid: { type: "string", description: "The numeric bot ID." } },
      required: ["botid"],
    },
    handler: async (a, c) => json((await c.get(`/bot/${arg(a, "botid")}/commands/deleted`)).data),
  },
  {
    name: "telebothost_recover_deleted_command",
    description: "Restore a soft-deleted command by its deletion record ID back into the bot's active commands.",
    inputSchema: {
      type: "object",
      properties: {
        botid: { type: "string", description: "The numeric bot ID." },
        deletedid: { type: "string", description: "The ObjectId of the soft-deleted command record." },
      },
      required: ["botid", "deletedid"],
    },
    handler: async (a, c) =>
      json(
        (await c.post(`/bot/${arg(a, "botid")}/commands/deleted/${arg(a, "deletedid")}/recover`)).data,
      ),
  },
];

// ===========================================================================
// 7. COMMUNITY STORE  (2 tools, auth required)
// ===========================================================================

const storeTools: ToolDef[] = [
  {
    name: "telebothost_list_store_bots",
    description:
      "List bots in the community store, sorted by popularity (install count). Authenticated endpoint.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter by store category." },
        search: { type: "string", description: "Search name, description, username, or tags (2-64 chars)." },
        page: { type: "string", default: "1" },
        limit: { type: "string", description: "Results per page (default 20, max 50)." },
      },
    },
    handler: async (a, c) =>
      json(
        (await c.get("/store/bots", {
          category: a.category,
          search: a.search,
          page: a.page,
          limit: a.limit,
        })).data,
      ),
  },
  {
    name: "telebothost_install_store_bot",
    description:
      "Install a community store bot into your account. Environment values are cleared and must be configured after install. Subject to store install rate limits (1/sec, 5/min, 20/hr). Requires sk_* key.",
    inputSchema: {
      type: "object",
      properties: {
        botMetaId: { type: "string", description: "The store listing _id from the list endpoint." },
      },
      required: ["botMetaId"],
    },
    handler: async (a, c) => json((await c.post(`/store/install/${arg(a, "botMetaId")}`)).data),
  },
];

// ===========================================================================
// 8. QUOTA  (1 tool)
// ===========================================================================

const quotaTools: ToolDef[] = [
  {
    name: "telebothost_get_quota",
    description:
      "Check your current rate-limit quota (daily, per-minute, monthly). Makes a lightweight GET /bot call and returns the X-RateLimit-* headers from the response.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    handler: async (_a, c) => {
      const res = await c.get("/bot");
      const h = res.headers;
      return json({
        daily: {
          limit: h.get("X-RateLimit-Limit"),
          remaining: h.get("X-RateLimit-Remaining"),
          reset: h.get("X-RateLimit-Reset"),
        },
        perMinute: {
          limit: h.get("X-RateLimit-Limit-Minute"),
          remaining: h.get("X-RateLimit-Remaining-Minute"),
          reset: h.get("X-RateLimit-Reset-Minute"),
        },
        perMonth: {
          limit: h.get("X-RateLimit-Limit-Month"),
          remaining: h.get("X-RateLimit-Remaining-Month"),
          reset: h.get("X-RateLimit-Reset-Month"),
        },
      });
    },
  },
];

// ===========================================================================
// Export all
// ===========================================================================

export const allTools: ToolDef[] = [
  ...healthTools,
  ...publicTools,
  ...botTools,
  ...storageTools,
  ...broadcastTools,
  ...commandTools,
  ...storeTools,
  ...quotaTools,
];

export type { TbhClientLike };
