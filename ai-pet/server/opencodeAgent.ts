import { spawn, spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
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
let opencodeCommandCache: string | undefined;
let projectRootCache: string | undefined;

function getModel() {
  return process.env.AI_PET_OPENCODE_MODEL || process.env.AI_PET_AGENT_MODEL || process.env.LLMMELON_MODEL || "claude-sonnet-4-6";
}

function getProviderId() {
  return process.env.AI_PET_OPENCODE_PROVIDER || "llmmelon";
}

function getProviderApiKey() {
  const provider = getProviderId();
  if (provider === "llmmelon") return process.env.LLMMELON_API_KEY || process.env.AI_PET_AGENT_API_KEY || "";
  if (provider === "aihubmix") {
    return process.env.AIHUBMIX_API_KEY || process.env.AI_HUB_MIX_API_KEY || process.env.AI_PET_AGENT_API_KEY || "";
  }
  if (provider === "yunwu") return process.env.YUNWU_API_KEY || process.env.AI_PET_AGENT_API_KEY || "";
  return process.env.AI_PET_AGENT_API_KEY || "";
}

function getRuntimeEnv() {
  const pathParts = [
    process.env.AI_PET_OPENCODE_EXTRA_PATH,
    "/opt/homebrew/bin",
    "/usr/local/bin",
    process.env.PATH
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(path.delimiter))
    .filter(Boolean);
  return {
    ...process.env,
    PATH: Array.from(new Set(pathParts)).join(path.delimiter)
  };
}

function isUsableProjectRoot(candidate?: string) {
  if (!candidate) return false;
  const resolved = path.resolve(candidate);
  if (resolved.includes(".asar")) return false;
  try {
    return statSync(resolved).isDirectory() && existsSync(path.join(resolved, "opencode.json"));
  } catch {
    return false;
  }
}

function getProjectRoot() {
  if (projectRootCache) return projectRootCache;
  const resourcesPath = (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath;
  const candidates = [
    process.env.AI_PET_OPENCODE_PROJECT_ROOT,
    process.cwd(),
    resourcesPath
  ];
  projectRootCache = candidates.find(isUsableProjectRoot) || path.resolve(process.cwd());
  return projectRootCache;
}

function hasProviderKey() {
  return Boolean(getProviderApiKey());
}

function getOpencodeVersion() {
  if (opencodeVersionCache !== undefined) return opencodeVersionCache;
  getOpencodeCommand();
  return opencodeVersionCache;
}

function getOpencodeCommand() {
  if (opencodeCommandCache !== undefined) return opencodeCommandCache || undefined;
  const candidates = [
    process.env.AI_PET_OPENCODE_BIN,
    "opencode",
    "/opt/homebrew/bin/opencode",
    "/usr/local/bin/opencode"
  ].filter(Boolean) as string[];
  for (const command of candidates) {
    const result = spawnSync(command, ["--version"], {
      encoding: "utf8",
      cwd: getProjectRoot(),
      env: getRuntimeEnv()
    });
    if (result.status === 0) {
      opencodeCommandCache = command;
      opencodeVersionCache = result.stdout.trim() || "installed";
      return opencodeCommandCache;
    }
  }
  opencodeCommandCache = "";
  opencodeVersionCache = "";
  return undefined;
}

export function isOpenCodeRuntimeAvailable() {
  if (process.env.AI_PET_AGENT_RUNTIME === "openai-agents") return false;
  if (!existsSync(path.join(getProjectRoot(), "opencode.json"))) return false;
  return Boolean(getOpencodeVersion() && hasProviderKey());
}

export function getOpenCodeRuntimeStatus() {
  const version = getOpencodeVersion();
  const provider = getProviderId();
  const projectRoot = getProjectRoot();
  const hasConfig = existsSync(path.join(projectRoot, "opencode.json"));
  const configured = Boolean(version && hasProviderKey() && hasConfig);
  return {
    provider: configured ? `opencode:${provider}` : "opencode-unconfigured",
    model: `${provider}/${getModel()}`,
    configured,
    cliVersion: version || undefined,
    mcp: configured ? "ai_pet" : undefined,
    projectRoot: hasConfig ? projectRoot : undefined,
    cliPath: version ? getOpencodeCommand() : undefined
  };
}

function formatRecentHistory(history: AgentChatMessage[], snapshot: AgentContextSnapshot) {
  const persona = getPersonaForProfile(snapshot.profile, snapshot.settings);
  const recent = history.slice(-16);
  if (!recent.length) return "- 暂无历史消息。";
  return recent
    .map((message) => {
      const author = message.authorName || (message.speaker === "user" ? persona.userDisplayName : persona.displayName);
      return `- ${author}: ${truncateAgentText(message.text, 180)}`;
    })
    .join("\n");
}

function formatRuntimeTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date());
}

function buildPrompt({ input, snapshot, threadId, responseMode, memory, history }: OpenCodeRunOptions) {
  const persona = getPersonaForProfile(snapshot.profile, snapshot.settings);
  return [
    "你正在 AI Pet 应用窗口的对话页里回答主人。",
    `主群聊 thread：${threadId}`,
    `本回合输出模式：${responseMode}`,
    `可见宠物角色：${persona.displayName}`,
    `当前运行时间：${formatRuntimeTime()}（Asia/Shanghai，本机时间；如果主人问几点或现在时间，直接用这个时间回答，只能加一句轻陪伴，不要添加健康、肚皮、进食、散步、任务或库存信息。）`,
    "",
    "当前前端状态快照：",
    JSON.stringify(compactPetSnapshot(snapshot), null, 2),
    "",
    "当前长期记忆：",
    memory.length ? memory.map((item) => `- [${item.type}] ${item.content}`).join("\n") : "- 暂无显式记忆。",
    "",
    "最近群聊记录：",
    formatRecentHistory(history, snapshot),
    "",
    "用户刚刚说：",
    input,
    "",
    "请按项目里的 ai-pet-companion Agent 提示词执行；如果问题涉及状态、照护、商品或动作，使用 ai_pet MCP tools。",
    "这条最终消息会同时显示在应用聊天和桌面宠物气泡里，不能拆成两版文案；请写成宠物本人对主人的一条中文陪伴消息。"
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

function extractError(events: unknown[]) {
  for (const event of events) {
    if (!event || typeof event !== "object") continue;
    const record = event as Record<string, unknown>;
    if (record.type !== "error" && !record.error) continue;
    const message =
      readStringAtPath(record, ["error", "data", "message"]) ||
      readStringAtPath(record, ["error", "message"]) ||
      readStringAtPath(record, ["message"]);
    return truncateAgentText(message || "opencode_error_event", 500);
  }
  return undefined;
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
    "--dir",
    getProjectRoot(),
    "--agent",
    "ai-pet-companion",
    "--model",
    `${provider}/${model}`,
    "--title",
    `ai-pet-${options.threadId}`,
    prompt
  ];

  const command = getOpencodeCommand();
  if (!command) throw new Error("opencode_cli_not_found");

  const child = spawn(command, args, {
    cwd: getProjectRoot(),
    env: {
      ...getRuntimeEnv(),
      LLMMELON_API_KEY: process.env.LLMMELON_API_KEY || process.env.AI_PET_AGENT_API_KEY || "",
      AIHUBMIX_API_KEY: process.env.AIHUBMIX_API_KEY || process.env.AI_HUB_MIX_API_KEY || process.env.AI_PET_AGENT_API_KEY || "",
      YUNWU_API_KEY: process.env.YUNWU_API_KEY || process.env.AI_PET_AGENT_API_KEY || "",
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
    }, Number(process.env.AI_PET_OPENCODE_TIMEOUT_MS || 15_000));
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
  const events = stdout
    .split(/\r?\n/)
    .map(parseEventLine)
    .filter((event): event is unknown => event !== undefined);
  const error = extractError(events);
  if (error) throw new Error(`opencode_api_error:${error}`);
  if (exitCode !== 0) {
    const detail = stderr.trim() || stdout.trim();
    throw new Error(`opencode_exit_${exitCode}:${truncateAgentText(detail, 500)}`);
  }
  const answer = extractAnswer(events, stdout);
  if (!answer.trim()) throw new Error("opencode_empty_output");
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
