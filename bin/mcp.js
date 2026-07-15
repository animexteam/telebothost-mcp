#!/usr/bin/env node
/**
 * TeleBotHost MCP Server — stdio entry point shim.
 *
 * This is the executable entry point referenced by package.json#bin.
 * It loads the tsx TypeScript loader and runs the actual server in mcp.ts.
 *
 * Used by MCP clients (Claude Desktop, Cursor, VS Code) that launch the
 * server as a subprocess and communicate via stdin/stdout.
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

const child = spawn(
  process.execPath,
  ["--import", "tsx", join(__dirname, "mcp.ts"), ...args],
  {
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error("Failed to start TeleBotHost MCP server:", err.message);
  console.error("Make sure tsx is installed: npm install tsx");
  process.exit(1);
});
