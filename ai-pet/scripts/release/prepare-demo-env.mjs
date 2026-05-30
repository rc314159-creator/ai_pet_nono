import { copyFileSync, existsSync, mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const releaseConfigDir = path.join(root, "release-config");
const releaseEnvFile = path.join(releaseConfigDir, ".env");
const localEnvFile = path.join(root, ".env.local");
const args = new Set(process.argv.slice(2));

mkdirSync(releaseConfigDir, { recursive: true });

if (existsSync(releaseEnvFile)) unlinkSync(releaseEnvFile);

if (args.has("--clean")) {
  console.log("Removed demo env from release-config.");
  process.exit(0);
}

if (!args.has("--include-local-env")) {
  console.log("No demo env requested.");
  process.exit(0);
}

if (!existsSync(localEnvFile)) {
  throw new Error("Cannot build demo installer with bundled env: .env.local is missing.");
}

copyFileSync(localEnvFile, releaseEnvFile);
console.log("Copied .env.local to release-config/.env for this demo installer build.");
