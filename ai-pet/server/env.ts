import fs from "node:fs";
import path from "node:path";

function parseEnvValue(raw: string) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(filePath: string, target: Record<string, string>) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = parseEnvValue(trimmed.slice(separator + 1));
    if (key) target[key] = value;
  }
}

const localEnv: Record<string, string> = {};
loadEnvFile(path.join(process.cwd(), ".env"), localEnv);
loadEnvFile(path.join(process.cwd(), ".env.local"), localEnv);

const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
if (resourcesPath) loadEnvFile(path.join(resourcesPath, ".env"), localEnv);
if (process.env.AI_PET_ENV_FILE) loadEnvFile(process.env.AI_PET_ENV_FILE, localEnv);

for (const [key, value] of Object.entries(localEnv)) {
  if (process.env[key] === undefined) process.env[key] = value;
}

if (process.env.OPENAI_AGENTS_DISABLE_TRACING === undefined) {
  process.env.OPENAI_AGENTS_DISABLE_TRACING = "1";
}
