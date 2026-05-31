#!/usr/bin/env node
const { existsSync } = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const cwd = process.cwd();
const bundledEntry = path.join(cwd, "build", "server", "mcp.cjs");
const sourceEntry = path.join(cwd, "server", "mcp.ts");
const localTsx = path.join(cwd, "node_modules", ".bin", "tsx");

let command;
let args;

if (existsSync(bundledEntry)) {
  command = process.execPath;
  args = [bundledEntry];
} else if (existsSync(sourceEntry) && existsSync(localTsx)) {
  command = localTsx;
  args = [sourceEntry];
} else {
  console.error(`AI Pet MCP entry not found in ${cwd}`);
  process.exit(1);
}

const child = spawn(command, args, {
  cwd,
  env: process.env,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
