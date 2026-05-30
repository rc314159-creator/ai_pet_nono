import { Agent, MemorySession, tool } from "@openai/agents";
import { z } from "zod";
import {
  buildTechDogAgentInstructions,
  createLocalAgentTurn,
  createToolCardFromMotion,
  getPersonaForProfile,
  isVoiceReplyRequested,
  mainThreadIdForPet,
  planAgentMotionToolCall,
  truncateAgentText
} from "../src/domain/agent";
import { createAgentMotionCommand } from "../src/domain/motion";
import { getAgentGatewayConfig, getAgentRunner } from "./agentGateway";
import { getOpenCodeRuntimeStatus, isOpenCodeRuntimeAvailable, runOpenCodePetAgent } from "./opencodeAgent";
import { appendThreadMemory, appendThreadMessages, getThreadMemories, getThreadMessages, replaceThreadMemories } from "./threadStore";
import { getVoiceRuntimeStatus, synthesizePetSpeech } from "./voice";
import type {
  AgentChatMessage,
  AgentContextSnapshot,
  AgentMemoryFact,
  AgentMemoryType,
  AgentResponseMode,
  AgentToolCard,
  PetAgentToolCall
} from "../src/domain/agent";
import type { ExpressionCommand, PetMotionAction } from "../src/domain/types";
import type { VoiceResult } from "./voice";

type AgentChatPayload = {
  input?: string;
  responseMode?: AgentResponseMode;
  threadId?: string;
  history?: AgentChatMessage[];
  clientTurnId?: string;
  clientMessageId?: string;
  clientCreatedAt?: string;
  context?: AgentContextSnapshot;
};

type PetAgentRuntimeContext = {
  snapshot: AgentContextSnapshot;
  threadId: string;
  responseMode: AgentResponseMode;
  memory: AgentMemoryFact[];
  history: AgentChatMessage[];
  toolCalls: PetAgentToolCall[];
  toolCards: AgentToolCard[];
  voiceResult?: VoiceResult;
  voiceAllowed: boolean;
  clientTurnId?: string;
};

type AgentChatResult = {
  provider: string;
  model: string;
  answer: string;
  responseMode: AgentResponseMode;
  personaId: string;
  threadId: string;
  message: AgentChatMessage;
  memory: AgentMemoryFact[];
  toolCalls: PetAgentToolCall[];
  toolCards: AgentToolCard[];
  motionCommand?: ExpressionCommand;
  motionCommands?: ExpressionCommand[];
  warning?: string;
  detail?: string;
};

type ProactiveAgentResult = {
  threadId: string;
  message?: AgentChatMessage;
  motionCommand?: ExpressionCommand;
  reason?: string;
  skipped?: "no_issue" | "already_latest" | "recent_issue_already_covered";
  messages: AgentChatMessage[];
};

const threadSessions = new Map<string, MemorySession>();
const memoryStore = new Map<string, AgentMemoryFact[]>();
const agentRunTimeoutMs = Number(process.env.AI_PET_AGENT_TIMEOUT_MS || 12000);

const motionActionSchema = z.enum([
  "idle",
  "idle_happy",
  "walk",
  "play",
  "sleep",
  "sleep_laze",
  "eat",
  "scratch",
  "bark",
  "tired_idle",
  "alert",
  "jump",
  "spin",
  "turn",
  "sit",
  "come_closer",
  "nod",
  "look_back",
  "tail_wag",
  "remind",
  "wake_stretch",
  "sniff_explore"
]);

function getThreadSession(threadId: string) {
  const existing = threadSessions.get(threadId);
  if (existing) return existing;
  const session = new MemorySession({ sessionId: threadId });
  threadSessions.set(threadId, session);
  return session;
}

function getThreadMemory(threadId: string, petDisplayName = "科技狗") {
  const existing = memoryStore.get(threadId);
  const stored = getThreadMemories(threadId);
  if (existing) {
    const seen = new Set(existing.map((item) => item.id));
    for (const item of stored) {
      if (!seen.has(item.id)) {
        existing.push(item);
        seen.add(item.id);
      }
    }
    return existing;
  }
  if (stored.length) {
    memoryStore.set(threadId, stored);
    return stored;
  }
  const memory: AgentMemoryFact[] = [
    {
      id: `${threadId}-memory-role`,
      type: "pet_memory",
      content: `Demo 固定群聊动物角色是${petDisplayName}；它负责在一个主群聊里连接文字、语音、动作、记忆和工具。`,
      createdAt: new Date().toISOString(),
      source: "system"
    }
  ];
  memoryStore.set(threadId, memory);
  replaceThreadMemories(threadId, memory);
  return memory;
}

function appendMemory(threadId: string, fact: AgentMemoryFact) {
  const memory = getThreadMemory(threadId);
  const duplicate = memory.find((item) => item.type === fact.type && item.content === fact.content && item.source === fact.source);
  if (duplicate) return memory;
  memory.push(fact);
  appendThreadMemory(threadId, fact);
  return memory;
}

function mergeAgentHistory(...groups: Array<AgentChatMessage[] | undefined>) {
  const seen = new Set<string>();
  const messages: AgentChatMessage[] = [];
  for (const group of groups) {
    for (const message of group || []) {
      if (!message?.id || seen.has(message.id) || !message.text.trim()) continue;
      seen.add(message.id);
      messages.push(message);
    }
  }
  return messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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

function extractExplicitMemory(input: string) {
  const normalized = input.trim();
  const patterns = [
    /(?:请你|帮我|你要)?记住[，,:：\s]*(.+)$/u,
    /(?:请你|帮我)?记一下[，,:：\s]*(.+)$/u,
    /以后[，,:：\s]*(.+)$/u,
    /下次[，,:：\s]*(.+)$/u
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const content = match?.[1]?.trim();
    if (content && content.length >= 2) return truncateAgentText(content, 220);
  }

  return undefined;
}

function findRecallMemory(input: string, memory: AgentMemoryFact[]) {
  if (!/(还记得|记得|我刚才说|我之前说|之前我说|我说过|几点|什么时候|多久)/.test(input)) return undefined;
  const candidates = memory.filter((item) => item.source === "user_explicit" || item.type === "participant_memory" || item.type === "event_memory");
  if (!candidates.length) return undefined;
  const stopChars = new Set("我你他她它的了呢吗呀吧啊和是会还记得之前刚才说过什么时候几点多久主人旺财".split(""));
  const score = (content: string) => Array.from(new Set(content)).filter((char) => !stopChars.has(char) && input.includes(char)).length;
  const ranked = [...candidates].sort((a, b) => score(b.content) - score(a.content) || b.createdAt.localeCompare(a.createdAt));
  const best = ranked[0];
  if (!best) return undefined;
  return score(best.content) >= 2 ? best : candidates.at(-1);
}

function createMemoryRecallAnswer(fact: AgentMemoryFact, petDisplayName: string) {
  const content = fact.content.replace(/^我/, "你说你").replace(/帮你/g, "帮我");
  return `记得呀，主人，${content}。${petDisplayName}会乖乖等你，先不疯跑。`;
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function createMemoryFact(type: AgentMemoryType, content: string, source: AgentMemoryFact["source"] = "agent_observed"): AgentMemoryFact {
  return {
    id: createMessageId("memory"),
    type,
    content: truncateAgentText(content, 260),
    createdAt: new Date().toISOString(),
    source
  };
}

function makeToolCard(kind: AgentToolCard["kind"], title: string, detail: string, meta?: string): AgentToolCard {
  return {
    id: createMessageId(`tool-${kind}`),
    kind,
    title,
    detail,
    meta
  };
}

function createTechDogTools() {
  return [
    tool({
      name: "get_pet_profile",
      description: "Read the current real pet profile behind the technology dog role.",
      parameters: z.object({}),
      execute: (_input, runContext) => {
        const runtime = runContext?.context as PetAgentRuntimeContext;
        return runtime.snapshot.profile;
      }
    }),
    tool({
      name: "get_pet_state",
      description: "Read today's pet state, live metrics, observations, and pending tasks.",
      parameters: z.object({}),
      execute: (_input, runContext) => {
        const runtime = runContext?.context as PetAgentRuntimeContext;
        return {
          state: runtime.snapshot.state,
          latestDailySummary: runtime.snapshot.latestDailySummary,
          currentDevicePacket: runtime.snapshot.currentDevicePacket,
          pendingTasks: runtime.snapshot.pendingTasks,
          manualObservations: runtime.snapshot.manualObservations
        };
      }
    }),
    tool({
      name: "get_daily_tasks",
      description: "Read current pending care and interaction tasks.",
      parameters: z.object({}),
      execute: (_input, runContext) => {
        const runtime = runContext?.context as PetAgentRuntimeContext;
        return runtime.snapshot.pendingTasks;
      }
    }),
    tool({
      name: "record_memory",
      description: "Record a long-term memory in the single main pet group chat when the user asks the pet to remember something.",
      parameters: z.object({
        type: z.enum(["participant_memory", "pet_memory", "event_memory", "thread_summary"]),
        content: z.string().min(1)
      }),
      execute: (input, runContext) => {
        const runtime = runContext?.context as PetAgentRuntimeContext;
        const fact = createMemoryFact(input.type, input.content, "user_explicit");
        appendMemory(runtime.threadId, fact);
        runtime.memory.push(fact);
        runtime.toolCards.push(makeToolCard("memory", "已写入记忆", fact.content, input.type));
        return fact;
      }
    }),
    tool({
      name: "recommend_products",
      description: "Return product recommendations connected to inventory, health observations, outfit, or care tasks.",
      parameters: z.object({
        reason: z.string().min(1)
      }),
      execute: (input, runContext) => {
        const runtime = runContext?.context as PetAgentRuntimeContext;
        const recommendations = runtime.snapshot.productRecommendations || [];
        const top = recommendations.slice(0, 3);
        runtime.toolCards.push(
          makeToolCard(
            "commerce",
            "商品推荐",
            top.length ? top.map((item) => `${item.title} ¥${item.priceCny}`).join(" / ") : "暂无可推荐商品",
            input.reason
          )
        );
        return top;
      }
    }),
    tool({
      name: "request_pet_motion",
      description:
        "Request a desktop pet action through the motion arbitration layer. Use it for explicit action requests like spin, turn, jump, sit, come closer, nod/look_back, tail_wag, walk, play, sleep_laze, remind, wake_stretch, sniff_explore, or alert.",
      parameters: z.object({
        action: motionActionSchema,
        reason: z.string().min(1)
      }),
      execute: (input, runContext) => {
        const runtime = runContext?.context as PetAgentRuntimeContext;
        const command = createAgentMotionCommand(input.action as PetMotionAction, input.reason, {
          targetView: "chat",
          conversationId: runtime.threadId
        });
        const call: PetAgentToolCall = {
          name: "request_pet_motion",
          arguments: {
            action: input.action as PetMotionAction,
            reason: input.reason,
            mode: "explicit"
          },
          command
        };
        runtime.toolCalls.push(call);
        runtime.toolCards.push(createToolCardFromMotion(call));
        return {
          ok: true,
          action: input.action,
          commandId: command.id,
          priority: command.priority
        };
      }
    }),
    tool({
      name: "reply_with_voice",
      description: "Prepare the current reply as a voice message. Use this when responseMode is voice or the user explicitly requests a voice reply.",
      parameters: z.object({
        utterance: z.string().min(1).max(600)
      }),
      execute: async (input, runContext) => {
        const runtime = runContext?.context as PetAgentRuntimeContext;
        if (!runtime.voiceAllowed) {
          return {
            ok: false,
            reason: "voice_not_requested_this_turn"
          };
        }
        const voice = await synthesizePetSpeech(input.utterance, runtime.snapshot);
        runtime.voiceResult = voice;
        runtime.toolCards.push(makeToolCard("voice", "语音回复", "已准备好一条语音", voice.voice));
        return {
          ok: true,
          transcript: voice.transcript,
          provider: voice.provider,
          voice: voice.voice
        };
      }
    })
  ];
}

function createTechDogAgent(model: string, displayName: string) {
  return new Agent<PetAgentRuntimeContext>({
    name: displayName,
    model,
    instructions: (runContext) =>
      buildTechDogAgentInstructions({
        context: runContext.context.snapshot,
        memory: runContext.context.memory,
        responseMode: runContext.context.responseMode
      }),
    modelSettings: {
      temperature: 0.55
    },
    tools: createTechDogTools(),
    toolUseBehavior: "run_llm_again"
  });
}

function buildPrompt(input: string, runtime: PetAgentRuntimeContext) {
  return [
    `主群聊：${runtime.threadId}`,
    `发言者：主人`,
    `本回合希望输出：${runtime.responseMode}`,
    "",
    "最近群聊记录：",
    formatRecentHistory(runtime.history),
    "",
    input
  ].join("\n");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}_timeout_${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function createMessageFromResult({
  answer,
  runtime,
  provider,
  model
}: {
  answer: string;
  runtime: PetAgentRuntimeContext;
  provider: string;
  model: string;
}): AgentChatMessage {
  const voice = runtime.voiceResult;
  const responseMode: AgentResponseMode = voice ? "voice" : runtime.responseMode;
  return {
    id: createMessageId("pet"),
    speaker: "pet",
    authorName: getPersonaForProfile(runtime.snapshot.profile).displayName,
    text: voice?.transcript || answer,
    createdAt: new Date().toISOString(),
    clientTurnId: runtime.clientTurnId,
    responseMode,
    provider,
    voiceProvider: voice?.provider,
    audioBase64: voice?.audioBase64,
    audioContentType: voice?.audioContentType,
    toolCards: runtime.toolCards
  };
}

function looksLikeRawAgentEventStream(text: string) {
  const trimmed = text.trim();
  return trimmed.startsWith('{"type":') || /"sessionID"|"tool_use"|"step_start"/.test(trimmed);
}

function getLlmmelonFastMotionModels() {
  return [
    process.env.LLMMELON_FAST_MOTION_MODEL,
    process.env.LLMMELON_MODEL,
    process.env.AI_PET_AGENT_MODEL,
    "claude-sonnet-4-6"
  ].reduce<string[]>((models, model) => {
    const name = String(model || "").trim();
    if (name && !models.includes(name)) models.push(name);
    return models;
  }, []);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createLlmmelonFastMotionReply(input: string, snapshot: AgentContextSnapshot, persona = getPersonaForProfile(snapshot.profile)) {
  const apiKey = process.env.LLMMELON_API_KEY || process.env.AI_PET_AGENT_API_KEY;
  if (!apiKey) return undefined;

  const baseURL = (process.env.LLMMELON_BASE_URL || process.env.AI_PET_AGENT_BASE_URL || "https://llmmelon.cloud/v1").replace(/\/$/, "");
  let lastError: Error | undefined;

  for (const model of getLlmmelonFastMotionModels()) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(`${baseURL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            temperature: 0.45,
            max_tokens: 140,
            messages: [
              {
                role: "system",
                content: [
                  `你是 AI Pet 主群聊里的宠物「${persona.displayName}」。`,
                  "主人提出了一个明确动作请求；动作工具已由系统触发，你只需要像宠物本人一样回复一句中文。",
                  "回复要有宠物身体感和陪伴感，可以说摇尾巴、凑近、歪头、爪爪、想被摸摸。",
                  "不要提模型、接口、工具、JSON、fallback、动作命令或系统实现。不要使用 emoji。最多一句动作描写加一句短回复。"
                ].join("\n")
              },
              {
                role: "user",
                content: input
              }
            ]
          })
        });

        const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string }; model?: string };
        if (!response.ok) throw new Error(data.error?.message || `llmmelon_chat_${response.status}`);
        const answer = truncateAgentText(String(data.choices?.[0]?.message?.content || "").trim(), 260);
        if (!answer) throw new Error("llmmelon_empty_motion_reply");
        return {
          provider: "llmmelon-direct",
          model: data.model || model,
          answer
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === 0) await delay(500);
      }
    }
  }

  throw lastError || new Error("llmmelon_motion_reply_failed");
}

function buildProactiveIssue(snapshot: AgentContextSnapshot) {
  const latest = snapshot.latestDailySummary;
  const notes = latest.notes.join("；");
  const skinObservation = snapshot.manualObservations.find((item) => /红点|抓挠|舔|皮肤|腹部/.test(item.note));
  const highTask = snapshot.pendingTasks.find((task) => task.priority === "high" && task.status === "pending");
  const expectedFood = snapshot.profile.diet.dailyGrams;
  const lowFood = latest.foodGrams > 0 && latest.foodGrams < expectedFood * 0.92;

  if (latest.scratchMinutes >= 24 || /抓挠|红点|皮肤/.test(notes) || skinObservation) {
    return {
      reason: `抓挠 ${latest.scratchMinutes} 分钟；${notes || skinObservation?.note || "需要皮肤观察"}`,
      text: `汪，主人，我今天肚皮有点痒，抓挠比平时多一点。你进来的时候能先帮我看看腹部红点吗？别安排太疯的奔跑，我想先被摸摸确认一下。`
    };
  }

  if (latest.healthIndex <= 78) {
    return {
      reason: `健康指数 ${latest.healthIndex}`,
      text: `汪，主人，我今天状态有点低，身体不像平时那么轻快。你先陪我观察一下吃饭、喝水和精神好不好，可以吗？`
    };
  }

  if (lowFood) {
    return {
      reason: `进食 ${latest.foodGrams}g，低于计划 ${expectedFood}g`,
      text: `汪，主人，我今天饭没有吃够，肚子有点空空的。你能帮我看看是不是该少量补一点，或者换个更舒服的喂法吗？`
    };
  }

  if (highTask) {
    return {
      reason: highTask.reason,
      text: `汪，主人，我有个要紧的小任务想提醒你：${highTask.title}。你进来了就先看看我，好不好？`
    };
  }

  return undefined;
}

const proactiveIssueTokens = ["肚皮", "红点", "皮肤", "饭没有吃够", "进食", "健康指数", "状态有点低"];

function sharesProactiveIssue(left: string, right: string) {
  return proactiveIssueTokens.some((token) => left.includes(token) && right.includes(token));
}

function recentMessagesAlreadyCoverIssue(messages: AgentChatMessage[], issueText: string) {
  return messages
    .slice(-8)
    .filter((message) => message.speaker === "pet")
    .some((message) => message.provider === "proactive-alert" || sharesProactiveIssue(message.text, issueText));
}

export function createProactiveAgentMessage(payload: { threadId?: string; context?: AgentContextSnapshot }): ProactiveAgentResult {
  if (!payload.context?.profile) throw new Error("context_required");

  const snapshot: AgentContextSnapshot = {
    ...payload.context,
    mainThreadId: payload.threadId || payload.context.mainThreadId || mainThreadIdForPet(payload.context.profile)
  };
  const threadId = snapshot.mainThreadId || mainThreadIdForPet(snapshot.profile);
  const issue = buildProactiveIssue(snapshot);
  const currentMessages = getThreadMessages(threadId);
  if (!issue) {
    return {
      threadId,
      skipped: "no_issue",
      messages: currentMessages
    };
  }

  const lastMessage = currentMessages.at(-1);
  if (lastMessage?.provider === "proactive-alert" && lastMessage.text === issue.text) {
    return {
      threadId,
      skipped: "already_latest",
      messages: currentMessages
    };
  }

  if (recentMessagesAlreadyCoverIssue(currentMessages, issue.text)) {
    return {
      threadId,
      skipped: "recent_issue_already_covered",
      messages: currentMessages
    };
  }

  const persona = getPersonaForProfile(snapshot.profile);
  const messageId = createMessageId("pet-proactive");
  const command = createAgentMotionCommand("remind", issue.reason, {
    targetView: "chat",
    conversationId: threadId,
    messageId,
    bubbleText: issue.text
  });
  const message: AgentChatMessage = {
    id: messageId,
    speaker: "pet",
    authorName: persona.displayName,
    text: issue.text,
    createdAt: new Date().toISOString(),
    responseMode: "text",
    provider: "proactive-alert"
  };
  const messages = appendThreadMessages(threadId, [message]);
  return {
    threadId,
    message,
    motionCommand: command,
    reason: issue.reason,
    messages
  };
}

export function getAgentRuntimeStatus() {
  const gateway = getAgentGatewayConfig();
  const voice = getVoiceRuntimeStatus();
  const opencode = getOpenCodeRuntimeStatus();
  if (isOpenCodeRuntimeAvailable()) {
    return {
      provider: opencode.provider,
      model: opencode.model,
      configured: opencode.configured,
      cliVersion: opencode.cliVersion,
      mcp: opencode.mcp,
      fallbackProvider: gateway.configured ? `openai-agents-sdk:${gateway.provider}` : "local-fallback",
      tts: voice.provider,
      ttsConfigured: voice.configured,
      ttsModel: voice.model,
      ttsVoice: voice.voice
    };
  }
  return {
    provider: gateway.configured ? `openai-agents-sdk:${gateway.provider}` : "local-fallback",
    model: gateway.model,
    configured: gateway.configured,
    baseURL: gateway.configured && gateway.provider !== "openai" ? gateway.baseURL : undefined,
    tts: voice.provider,
    ttsConfigured: voice.configured,
    ttsModel: voice.model,
    ttsVoice: voice.voice
  };
}

export async function createPetAgentReply(payload: AgentChatPayload): Promise<AgentChatResult> {
  const input = String(payload.input || "").trim();
  if (!input) throw new Error("input_required");
  if (!payload.context?.profile) throw new Error("context_required");

  const snapshot: AgentContextSnapshot = {
    ...payload.context,
    mainThreadId: payload.threadId || payload.context.mainThreadId || mainThreadIdForPet(payload.context.profile)
  };
  const threadId = snapshot.mainThreadId || mainThreadIdForPet(snapshot.profile);
  const responseMode: AgentResponseMode = payload.responseMode === "voice" ? "voice" : "text";
  const voiceAllowed = responseMode === "voice" || isVoiceReplyRequested(input);
  const persona = getPersonaForProfile(snapshot.profile);
  const memory = getThreadMemory(threadId, persona.displayName);
  const history = mergeAgentHistory(getThreadMessages(threadId), payload.history);
  const runtime: PetAgentRuntimeContext = {
    snapshot,
    threadId,
    responseMode,
    memory: [...memory],
    history,
    toolCalls: [],
    toolCards: [],
    voiceAllowed,
    clientTurnId: typeof payload.clientTurnId === "string" ? payload.clientTurnId.trim() : undefined
  };
  const explicitMemory = extractExplicitMemory(input);
  if (explicitMemory && !runtime.memory.some((item) => item.type === "participant_memory" && item.content === explicitMemory && item.source === "user_explicit")) {
    const fact = createMemoryFact("participant_memory", explicitMemory, "user_explicit");
    appendMemory(threadId, fact);
    runtime.memory.push(fact);
    runtime.toolCards.push(makeToolCard("memory", "已写入记忆", fact.content, fact.type));
  }

  const recalledMemory = !explicitMemory ? findRecallMemory(input, runtime.memory) : undefined;
  if (recalledMemory) {
    runtime.toolCards.push(makeToolCard("memory", "长期记忆", recalledMemory.content, recalledMemory.type));
    const message = createMessageFromResult({
      answer: createMemoryRecallAnswer(recalledMemory, persona.displayName),
      runtime,
      provider: "local-memory",
      model: "thread-store"
    });
    return {
      provider: "local-memory",
      model: "thread-store",
      personaId: persona.id,
      threadId,
      answer: message.text,
      responseMode: message.responseMode || responseMode,
      message,
      memory: getThreadMemory(threadId, persona.displayName),
      toolCalls: runtime.toolCalls,
      toolCards: runtime.toolCards
    };
  }

  const fallback = async (warning?: string, detail?: string): Promise<AgentChatResult> => {
    const local = createLocalAgentTurn(input, snapshot, responseMode, persona);
    runtime.toolCalls.push(...local.toolCalls);
    runtime.toolCards.push(...local.toolCards);
    if (voiceAllowed) {
      runtime.voiceResult = await synthesizePetSpeech(local.answer, snapshot);
      runtime.toolCards.push(makeToolCard("voice", "语音回复", "已准备好一条语音", runtime.voiceResult.voice));
    }
    const message = createMessageFromResult({
      answer: local.answer,
      runtime,
      provider: "local-fallback",
      model: "persona-rule-engine"
    });
    const motionCommands = runtime.toolCalls.map((call) => call.command);
    return {
      provider: "local-fallback",
      model: "persona-rule-engine",
      personaId: persona.id,
      threadId,
      answer: message.text,
      responseMode: message.responseMode || responseMode,
      message,
      memory: getThreadMemory(threadId, persona.displayName),
      toolCalls: runtime.toolCalls,
      toolCards: runtime.toolCards,
      motionCommand: motionCommands.at(-1),
      motionCommands,
      warning,
      detail
    };
  };

  const explicitMotionCall = planAgentMotionToolCall(input, snapshot);
  if (explicitMotionCall) {
    runtime.toolCalls.push(explicitMotionCall);
    runtime.toolCards.push(createToolCardFromMotion(explicitMotionCall));

    let provider = "llmmelon-direct";
    let model = process.env.LLMMELON_FAST_MOTION_MODEL || process.env.LLMMELON_MODEL || process.env.AI_PET_AGENT_MODEL || "claude-sonnet-4-6";
    let warning: string | undefined;
    let detail: string | undefined;
    let answer: string;

    try {
      const timeoutMs = Number(process.env.LLMMELON_FAST_MOTION_TIMEOUT_MS || 25000);
      const fastReply = await withTimeout(createLlmmelonFastMotionReply(input, snapshot, persona), timeoutMs, "llmmelon_motion_reply");
      answer = fastReply?.answer || createLocalAgentTurn(input, snapshot, responseMode, persona).answer;
      provider = fastReply?.provider || "local-fallback";
      model = fastReply?.model || "persona-rule-engine";
    } catch (error) {
      warning = "llmmelon_motion_fast_reply_error";
      detail = error instanceof Error ? error.message : String(error);
      const local = createLocalAgentTurn(input, snapshot, responseMode, persona);
      answer = local.answer;
      provider = "local-fallback";
      model = "persona-rule-engine";
    }

    const refreshedMotionCall: PetAgentToolCall = {
      ...explicitMotionCall,
      command: createAgentMotionCommand(explicitMotionCall.arguments.action, explicitMotionCall.arguments.reason, explicitMotionCall.command.context)
    };
    runtime.toolCalls[0] = refreshedMotionCall;
    runtime.toolCards[0] = createToolCardFromMotion(refreshedMotionCall);

    if (!runtime.voiceResult && responseMode === "voice" && answer) {
      runtime.voiceResult = await synthesizePetSpeech(answer, snapshot);
      runtime.toolCards.push(makeToolCard("voice", "语音回复", "已准备好一条语音", runtime.voiceResult.voice));
    }

    const message = createMessageFromResult({
      answer,
      runtime,
      provider,
      model
    });
    const motionCommands = runtime.toolCalls.map((call) => call.command);
    return {
      provider,
      model,
      personaId: persona.id,
      threadId,
      answer: message.text,
      responseMode: message.responseMode || responseMode,
      message,
      memory: getThreadMemory(threadId, persona.displayName),
      toolCalls: runtime.toolCalls,
      toolCards: runtime.toolCards,
      motionCommand: motionCommands.at(-1),
      motionCommands,
      warning,
      detail
    };
  }

  if (isOpenCodeRuntimeAvailable()) {
    try {
      const opencode = await runOpenCodePetAgent({
        input,
        snapshot,
        threadId,
        responseMode,
        memory: runtime.memory,
        history: runtime.history
      });
      runtime.toolCalls.push(...opencode.toolCalls);
      runtime.toolCards.push(...opencode.toolCards);
      if (!runtime.toolCalls.some((call) => call.name === "request_pet_motion")) {
        const recoveredMotionCall = planAgentMotionToolCall(input, snapshot);
        if (recoveredMotionCall) {
          runtime.toolCalls.push(recoveredMotionCall);
          runtime.toolCards.push(createToolCardFromMotion(recoveredMotionCall));
        }
      }
      const localBackup = looksLikeRawAgentEventStream(opencode.answer) ? createLocalAgentTurn(input, snapshot, responseMode, persona) : undefined;
      const cleanAnswer = localBackup?.answer || opencode.answer;
      if (!runtime.voiceResult && voiceAllowed && cleanAnswer) {
        runtime.voiceResult = await synthesizePetSpeech(cleanAnswer, snapshot);
        runtime.toolCards.push(makeToolCard("voice", "语音回复", "已准备好一条语音", runtime.voiceResult.voice));
      }
      const message = createMessageFromResult({
        answer: runtime.voiceResult?.transcript || cleanAnswer,
        runtime,
        provider: opencode.provider,
        model: opencode.model
      });
      const motionCommands = runtime.toolCalls.map((call) => call.command);
      return {
        provider: opencode.provider,
        model: opencode.model,
        personaId: persona.id,
        threadId,
        answer: message.text,
        responseMode: message.responseMode || responseMode,
        message,
        memory: getThreadMemory(threadId, persona.displayName),
        toolCalls: runtime.toolCalls,
        toolCards: runtime.toolCards,
        motionCommand: motionCommands.at(-1),
        motionCommands
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.warn(`OpenCode agent runtime failed, falling back: ${detail}`);
      return fallback("opencode_agent_request_error", detail);
    }
  }

  const gateway = getAgentGatewayConfig();
  const runner = getAgentRunner(gateway);
  if (!gateway.configured || !runner) return fallback();

  try {
    const agent = createTechDogAgent(gateway.model, persona.displayName);
    const result = await withTimeout(
      runner.run(agent, buildPrompt(input, runtime), {
        context: runtime,
        session: getThreadSession(threadId),
        maxTurns: 5
      }),
      agentRunTimeoutMs,
      "openai_agents_run"
    );
    const finalOutput = truncateAgentText(String(result.finalOutput || ""));
    if (!runtime.toolCalls.some((call) => call.name === "request_pet_motion")) {
      const recoveredMotionCall = planAgentMotionToolCall(input, snapshot);
      if (recoveredMotionCall) {
        runtime.toolCalls.push(recoveredMotionCall);
        runtime.toolCards.push(createToolCardFromMotion(recoveredMotionCall));
      }
    }
    if (!runtime.voiceResult && voiceAllowed && finalOutput) {
      runtime.voiceResult = await synthesizePetSpeech(finalOutput, snapshot);
      runtime.toolCards.push(makeToolCard("voice", "语音回复", "已准备好一条语音", runtime.voiceResult.voice));
    }
    const answer = runtime.voiceResult?.transcript || finalOutput || (await fallback("openai_agents_empty_output")).answer;
    const provider = `openai-agents-sdk:${gateway.provider}`;
    const message = createMessageFromResult({
      answer,
      runtime,
      provider,
      model: gateway.model
    });

    const motionCommands = runtime.toolCalls.map((call) => call.command);
    return {
      provider,
      model: gateway.model,
      personaId: persona.id,
      threadId,
      answer: message.text,
      responseMode: message.responseMode || responseMode,
      message,
      memory: getThreadMemory(threadId),
      toolCalls: runtime.toolCalls,
      toolCards: runtime.toolCards,
      motionCommand: motionCommands.at(-1),
      motionCommands
    };
  } catch (error) {
    return fallback("openai_agents_request_error", error instanceof Error ? error.message : String(error));
  }
}
