#!/usr/bin/env node
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const projectRoot = path.resolve(appRoot, "..");
const outputDir = path.join(projectRoot, "exports", "source");
const now = new Date();
const pad = (value) => String(value).padStart(2, "0");
const stamp = [
  now.getFullYear(),
  pad(now.getMonth() + 1),
  pad(now.getDate()),
  "-",
  pad(now.getHours()),
  pad(now.getMinutes()),
  pad(now.getSeconds())
].join("");
const outputFile = path.join(outputDir, `ai-pet-system-source-${stamp}.zip`);

const excludes = [
  ".git/*",
  ".playwright-mcp/*",
  ".DS_Store",
  "**/.DS_Store",
  "**/*.tsbuildinfo",
  "**/node_modules/*",
  "ai-pet/.opencode/node_modules/*",
  "ai-pet/.ai-pet-data/*",
  "ai-pet/build/*",
  "ai-pet/dist/*",
  "ai-pet/release/*",
  "ai-pet/release-config/.env",
  "ai-pet/.env",
  "ai-pet/.env.local",
  "ai-pet/*.log",
  "ai-pet/public/assets/pets/mochi/motion-sources/*",
  "ai-pet/public/assets/pets/mochi/motion-sheets/*",
  "ai-pet/public/assets/pets/mochi/motions/sniff-explore-v1-candidates/*",
  "ai-pet/public/assets/pets/mochi/motions/walk-v2-rejected/*",
  "reports/*",
  "exports/*"
];

mkdirSync(outputDir, { recursive: true });
rmSync(outputFile, { force: true });

const args = ["-qr", outputFile, ".", ...excludes.flatMap((pattern) => ["-x", pattern])];
const result = spawnSync("zip", args, {
  cwd: projectRoot,
  stdio: "inherit"
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Source package written: ${outputFile}`);
