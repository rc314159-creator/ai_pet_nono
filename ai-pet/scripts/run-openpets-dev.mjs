import { spawn, execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const knownOpenPetsRoots = [
  "/Users/rencan/Library/Application Support/MeetingCopilot/sessions/2026-05-09T02-18-28Z/pet-sandbox-repos/openpets"
];

function expandHome(path) {
  return path.startsWith("~/") ? join(homedir(), path.slice(2)) : path;
}

function candidateRoots() {
  const envRoot = process.env.OPENPETS_ROOT ? [process.env.OPENPETS_ROOT] : [];
  return [
    ...envRoot,
    resolve(process.cwd(), "../openpets"),
    resolve(process.cwd(), "../../openpets"),
    ...knownOpenPetsRoots
  ].map(expandHome);
}

function resolveOpenPetsRoot() {
  for (const root of candidateRoots()) {
    if (existsSync(join(root, "package.json")) && existsSync(join(root, "apps/desktop/package.json"))) {
      return root;
    }
  }
  return undefined;
}

function runningPid() {
  const discoveryPath = join(homedir(), "Library/Application Support/OpenPets/runtime/ipc.json");
  if (!existsSync(discoveryPath)) return undefined;
  try {
    const discovery = JSON.parse(readFileSync(discoveryPath, "utf8"));
    if (typeof discovery.pid !== "number") return undefined;
    process.kill(discovery.pid, 0);
    return discovery.pid;
  } catch {
    return undefined;
  }
}

function sayConnected(root) {
  const cliPath = join(root, "packages/cli/dist/index.js");
  if (!existsSync(cliPath)) return;
  try {
    execFileSync(process.execPath, [
      cliPath,
      "say",
      "AI Pet MVP 已连接：Mochi 的桌面宠物提醒已启用。",
      "--reaction",
      "success"
    ], { cwd: root, stdio: "ignore" });
  } catch {
    // The dev server still runs; the Web/API panel will surface connection status.
  }
}

const root = resolveOpenPetsRoot();
if (!root) {
  console.error("OpenPets repo not found. Set OPENPETS_ROOT to the local OpenPets checkout.");
  process.exit(1);
}

const pid = runningPid();
if (pid) {
  console.log(`OpenPets already running with pid ${pid}.`);
  sayConnected(root);
  setInterval(() => {}, 60_000);
} else {
  const child = spawn("pnpm", ["dev:desktop"], {
    cwd: root,
    env: process.env,
    stdio: "inherit"
  });

  const shutdown = () => {
    child.kill("SIGTERM");
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
}
