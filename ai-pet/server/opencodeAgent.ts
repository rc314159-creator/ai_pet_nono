import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { compactPetSnapshot } from "./petRuntimeSnapshot";
import { createToolCardFromMotion, getPersonaForProfile, truncateAgentText } from "../src/domain/agent";
import { createAgentMotionCommand } from "../src/domain/motion";
import type { AgentChatMessage, AgentContextSnapshot, AgentMemoryFact, AgentResponseMode, AgentToolCard, PetAgentToolCall } from "../src/domain/agent";
import type { ExpressionCommand, PetMotionAction } from "../src/domain/types";

type OpenCodeRunOptions = {
  input: string;
  snapshot: AgentContextSnapshot;
  threadId: string;
  responseMode: AgentResponseMode;
  memory: AgentMemoryFact[];
  history: AgentChatMessage[];
};

type OpenCodeRunResult = {
  provider: string;
  model: string;
  answer: string;
  sessionId?: string;
  toolCalls: PetAgentToolCall[];
  toolCards: AgentToolCard[];
  events: unknown[];
};

let opencodeVersionCache: string | undefined;

function getModel() {
  return process.env.AI_PET_OPENCODE_MODEL || process.env.AI_PET_AGENT_MODEL || process.env.LLMMELON_MODEL || "claude-sonnet-4-6";
}

function getProviderId() {
  return process.env.AI_PET_OPENCODE_PROVIDER || "llmmelon";
}

function getProviderApiKey() {
  const provider = getProviderId();
  if (provider !== "llmmelon") return "";
  return process.env.LLMMELON_API_KEY || process.env.AI_PET_AGENT_API_KEY || "";
}

function getProjectRoot() {
  return path.resolve(process.cwd());
}

function hasProviderKey() {
  return Boolean(getProviderApiKey());
}

function getOpencodeVersion() {
  if (opencodeVersionCache !== undefined) return opencodeVersionCache;
  const result = spawnSync("opencode", ["--version"], {
    encoding: "utf8",
    cwd: getProjectRoot(),
    env: process.env
  });
  opencodeVersionCache = result.status === 0 ? result.stdout.trim() || "installed" : "";
  return opencodeVersionCache;
}

export function isOpenCodeRuntimeAvailable() {
  if (process.env.AI_PET_AGENT_RUNTIME === "openai-agents") return false;
  if (!existsSync(path.join(getProjectRoot(), "opencode.json"))) return false;
  return Boolean(getOpencodeVersion() && hasProviderKey());
}

export function getOpenCodeRuntimeStatus() {
  const version = getOpencodeVersion();
  const provider = getProviderId();
  const configured = Boolean(version && hasProviderKey() && existsSync(path.join(getProjectRoot(), "opencode.json")));
  return {
    provider: configured ? `opencode:${provider}` : "opencode-unconfigured",
    model: `${provider}/${getModel()}`,
    configured,
    cliVersion: version || undefined,
    mcp: configured ? "ai_pet" : undefined
  };
}

function formatRecentHistory(history: AgentChatMessage[]) {
  const recent = history.slice(-16);
  if (!recent.length) return "- 暂无历史消息。";
  return recent
    .map((message) => {
      const author = message.authorName || (message.speaker === "user" ? "主人" : "旺财");
      return `- ${author}: ${truncateAgentText(message.text, 180)}`;
    })
    .join("\n");
}

function buildPrompt({ input, snapshot, threadId, responseMode, memory, history }: OpenCodeRunOptions) {
  const persona = getPersonaForProfile(snapshot.profile);
  return [
    "你正在 AI Pet 应用窗口的对话页里回答主人。",
    `主群聊 thread：${threadId}`,
    `本回合输出模式：${responseMode}`,
    `可见宠物角色：${persona.displayName}`,
    "",
    "当前前端状态快照：",
    JSON.stringify(compactPetSnapshot(snapshot), null, 2),
    "",
    "当前长期记忆：",
    memory.length ? memory.map((item) => `- [${item.type}] ${item.content}`).join("\n") : "- 暂无显式记忆。",
    "",
    "最近群聊记录：",
    formatRecentHistory(history),
    "",
    "用户刚刚说：",
    input,
    "",
    "请按项目里的 ai-pet-companion Agent 提示词执行；如果问题涉及状态、照护、商品或动作，使用 ai_pet MCP tools。最终只输出宠物在群聊里发给主人的一条中文消息。"
  ].join("\n");
}

function parseEventLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return undefined;
  }
}

function readStringAtPath(value: unknown, pathParts: string[]) {
  let current: unknown = value;
  for (const part of pathParts) {
    if (!current || typeof current !== "object" || !(part in current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

function collectTextParts(value: unknown, out: string[] = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    for (const item of value) collectTextParts(item, out);
    return out;
  }
  const record = value as Record<string, unknown>;
  if (record.type === "text" && typeof record.text === "string") out.push(record.text);
  for (const child of Object.values(record)) collectTextParts(child, out);
  return out;
}

function extractAnswer(events: unknown[], fallbackText: string) {
  const preferredPaths = [
    ["result"],
    ["message", "content"],
    ["data", "result"],
    ["data", "message", "content"],
    ["event", "message", "content"],
    ["event", "result"]
  ];

  for (const event of [...events].reverse()) {
    for (const pathParts of preferredPaths) {
      const text = readStringAtPath(event, pathParts);
      if (text && !looksLikeToolJson(text)) return truncateAgentText(text, 900);
    }
    const textParts = collectTextParts(event).filter((text) => !looksLikeToolJson(text));
    if (textParts.length) return truncateAgentText(textParts.join(""), 900);
  }

  return truncateAgentText(fallbackText, 900);
}

function looksLikeToolJson(text: string) {
  const trimmed = text.trim();
  return trimmed.startsWith("{") && /"command"|"pendingTasks"|"latestDailySummary"|"profile"/.test(trimmed);
}

function isExpressionCommand(value: unknown): value is ExpressionCommand {
  const record = value as Partial<ExpressionCommand>;
  return Boolean(
    record &&
      typeof record === "object" &&
      record.target === "desktop_pet" &&
      typeof record.id === "string" &&
      typeof record.action === "string" &&
      record.source === "agent_tool_call"
  );
}

function collectMotionCommands(value: unknown, out: ExpressionCommand[] = []) {
  if (!value) return out;
  if (typeof value === "string") {
    if (!/"command"|"desktop_pet"|"agent_tool_call"/.test(value)) return out;
    try {
      collectMotionCommands(JSON.parse(value), out);
    } catch {
      return out;
    }
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectMotionCommands(item, out);
    return out;
  }
  if (typeof value !== "object") return out;

  if (isExpressionCommand(value)) {
    out.push(value);
    return out;
  }

  const record = value as Record<string, unknown>;
  if (isExpressionCommand(record.command)) out.push(record.command);
  for (const child of Object.values(record)) collectMotionCommands(child, out);
  return out;
}

function extractMotionToolCalls(events: unknown[]) {
  const byId = new Map<string, ExpressionCommand>();
  for (const command of collectMotionCommands(events)) byId.set(command.id, command);
  const toolCalls: PetAgentToolCall[] = [];
  for (const command of byId.values()) {
    toolCalls.push({
      name: "request_pet_motion",
      arguments: {
        action: command.action as PetMotionAction,
        reason: command.reason,
        mode: "explicit"
      },
      command
    });
  }
  return toolCalls;
}

function refreshMotionToolCall(call: PetAgentToolCall, threadId: string): PetAgentToolCall {
  const command = createAgentMotionCommand(call.arguments.action, call.arguments.reason, {
    targetView: call.command.context?.targetView || "chat",
    conversationId: call.command.context?.conversationId || threadId
  });
  return {
    ...call,
    command
  };
}

export async function runOpenCodePetAgent(options: OpenCodeRunOptions): Promise<OpenCodeRunResult> {
  if (!isOpenCodeRuntimeAvailable()) {
    throw new Error("opencode_runtime_not_configured");
  }

  const model = getModel();
  const provider = getProviderId();
  const prompt = buildPrompt(options);
  const args = [
    "run",
    "--format",
    "json",
    "--agent",
    "ai-pet-companion",
    "--model",
    `${provider}/${model}`,
    "--title",
    `ai-pet-${options.threadId}`,
    prompt
  ];

  const child = spawn("opencode", args, {
    cwd: getProjectRoot(),
    env: {
      ...process.env,
      LLMMELON_API_KEY: process.env.LLMMELON_API_KEY || process.env.AI_PET_AGENT_API_KEY || "",
      NO_COLOR: "1"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const stdoutChunks: Buffer[] = [];
  const stderrChunks: Buffer[] = [];
  child.stdout.on("data", (chunk) => stdoutChunks.push(Buffer.from(chunk)));
  child.stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));

  const exitCode = await new Promise<number | null>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("opencode_request_timeout"));
    }, Number(process.env.AI_PET_OPENCODE_TIMEOUT_MS || 75_000));
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });

  const stdout = Buffer.concat(stdoutChunks).toString("utf8");
  const stderr = Buffer.concat(stderrChunks).toString("utf8");
  if (exitCode !== 0) {
    throw new Error(`opencode_exit_${exitCode}:${stderr.trim().slice(0, 500)}`);
  }

  const events = stdout
    .split(/\r?\n/)
    .map(parseEventLine)
    .filter((event): event is unknown => event !== undefined);
  const answer = extractAnswer(events, stdout);
  const toolCalls = extractMotionToolCalls(events).map((call) => refreshMotionToolCall(call, options.threadId));
  const toolCards = toolCalls.map(createToolCardFromMotion);
  const sessionId = events
    .map((event) => readStringAtPath(event, ["sessionID"]) || readStringAtPath(event, ["sessionId"]) || readStringAtPath(event, ["session", "id"]))
    .find(Boolean);

  return {
    provider: `opencode:${provider}`,
    model: `${provider}/${model}`,
    answer,
    sessionId,
    toolCalls,
    toolCards,
    events
  };
}
