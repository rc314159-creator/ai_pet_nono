import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const knownOpenPetsRoots = [
  "/Users/rencan/Library/Application Support/MeetingCopilot/sessions/2026-05-09T02-18-28Z/pet-sandbox-repos/openpets"
];

export type OpenPetsDesktopStatus = {
  configured: boolean;
  connected: boolean;
  root?: string;
  cliPath?: string;
  error?: string;
  appRunning?: boolean;
  appVersion?: string;
  defaultPetVisible?: boolean;
  speechBubblesEnabled?: boolean;
  defaultPet?: {
    id?: string;
    displayName?: string;
    builtIn?: boolean;
    broken?: boolean;
  };
};

type CliResult = {
  stdout: string;
  stderr: string;
  root: string;
  cliPath: string;
};

function expandHome(path: string) {
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

export function resolveOpenPetsRoot() {
  for (const root of candidateRoots()) {
    if (existsSync(join(root, "package.json")) && existsSync(join(root, "packages/cli/package.json"))) {
      return root;
    }
  }
  return undefined;
}

export function getDiscoverySnapshot() {
  const path = join(homedir(), "Library/Application Support/OpenPets/runtime/ipc.json");
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as { pid?: number; endpoint?: string; appVersion?: string };
  } catch {
    return undefined;
  }
}

async function runOpenPetsCli(args: string[], timeout = 6000): Promise<CliResult> {
  const root = resolveOpenPetsRoot();
  if (!root) throw new Error("OpenPets root not found. Set OPENPETS_ROOT to the local OpenPets checkout.");

  const cliPath = join(root, "packages/cli/dist/index.js");
  if (!existsSync(cliPath)) {
    throw new Error(`OpenPets CLI is not built at ${cliPath}. Run pnpm --filter @open-pets/cli build in the OpenPets repo.`);
  }

  const { stdout, stderr } = await execFileAsync(process.execPath, [cliPath, ...args], {
    cwd: root,
    env: process.env,
    timeout,
    maxBuffer: 1024 * 1024
  });

  return {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    root,
    cliPath
  };
}

export async function getOpenPetsStatus(): Promise<OpenPetsDesktopStatus> {
  const root = resolveOpenPetsRoot();
  if (!root) {
    return {
      configured: false,
      connected: false,
      error: "OpenPets root not found. Set OPENPETS_ROOT to the local OpenPets checkout."
    };
  }

  const cliPath = join(root, "packages/cli/dist/index.js");
  if (!existsSync(cliPath)) {
    return {
      configured: true,
      connected: false,
      root,
      cliPath,
      error: "OpenPets CLI is not built."
    };
  }

  try {
    const result = await runOpenPetsCli(["status"]);
    const status = JSON.parse(result.stdout) as Omit<OpenPetsDesktopStatus, "configured" | "connected" | "root" | "cliPath">;
    return {
      configured: true,
      connected: Boolean(status.appRunning),
      root: result.root,
      cliPath: result.cliPath,
      ...status
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      root,
      cliPath,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function sayOpenPets(message: string, reaction = "success") {
  const trimmed = message.trim();
  if (!trimmed) throw new Error("message_required");
  if (trimmed.length > 480) throw new Error("message_too_long");

  const result = await runOpenPetsCli(["say", trimmed, "--reaction", reaction], 8000);
  return {
    ok: true,
    output: result.stdout,
    root: result.root,
    cliPath: result.cliPath
  };
}
