import { Agent, MemorySession, run, tool } from "@openai/agents";
import { z } from "zod";
import {
  buildTechDogAgentInstructions,
  createLocalAgentTurn,
  createToolCardFromMotion,
  getPersonaForProfile,
  mainThreadIdForPet,
  truncateAgentText
} from "../src/domain/agent";
import { createAgentMotionCommand } from "../src/domain/motion";
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

type AgentChatPayload = {
  input?: string;
  responseMode?: AgentResponseMode;
  threadId?: string;
  history?: AgentChatMessage[];
  context?: AgentContextSnapshot;
};

type VoiceResult = {
  transcript: string;
  provider: string;
  model: string;
  voice: string;
  audioBase64?: string;
  audioContentType?: string;
  warning?: string;
};

type PetAgentRuntimeContext = {
  snapshot: AgentContextSnapshot;
  threadId: string;
  responseMode: AgentResponseMode;
  memory: AgentMemoryFact[];
  toolCalls: PetAgentToolCall[];
  toolCards: AgentToolCard[];
  voiceResult?: VoiceResult;
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
  warning?: string;
  detail?: string;
};

const threadSessions = new Map<string, MemorySession>();
const memoryStore = new Map<string, AgentMemoryFact[]>();

const motionActionSchema = z.enum([
  "idle",
  "idle_happy",
  "walk",
  "play",
  "sleep",
  "eat",
  "scratch",
  "bark",
  "tired_idle",
  "alert",
  "jump",
  "spin",
  "sit",
  "come_closer",
  "nod"
]);

function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY || process.env.AI_PET_OPENAI_API_KEY || "";
}

function ensureOpenAiApiKey() {
  const apiKey = getOpenAiApiKey();
  if (apiKey && !process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = apiKey;
  return apiKey;
}

function getThreadSession(threadId: string) {
  const existing = threadSessions.get(threadId);
  if (existing) return existing;
  const session = new MemorySession({ sessionId: threadId });
  threadSessions.set(threadId, session);
  return session;
}

function getThreadMemory(threadId: string) {
  const existing = memoryStore.get(threadId);
  if (existing) return existing;
  const memory: AgentMemoryFact[] = [
    {
      id: `${threadId}-memory-role`,
      type: "pet_memory",
      content: "Demo 固定群聊动物角色是科技狗；它负责在一个主群聊里连接文字、语音、动作、记忆和工具。",
      createdAt: new Date().toISOString(),
      source: "system"
    }
  ];
  memoryStore.set(threadId, memory);
  return memory;
}

function appendMemory(threadId: string, fact: AgentMemoryFact) {
  const memory = getThreadMemory(threadId);
  memory.push(fact);
  return memory;
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

async function synthesizePetSpeech(text: string, context: AgentContextSnapshot): Promise<VoiceResult> {
  const persona = getPersonaForProfile(context.profile);
  const input = truncateAgentText(text, 600);
  const apiKey = process.env.AI_PET_TTS_API_KEY || getOpenAiApiKey();
  const model = process.env.AI_PET_TTS_MODEL || persona.tts.model;
  const voice = process.env.AI_PET_TTS_VOICE || persona.tts.voice;
  const instructions = process.env.AI_PET_TTS_INSTRUCTIONS || persona.tts.instructions;

  if (!apiKey) {
    return {
      transcript: input,
      provider: "browser-speech-fallback",
      model: "system-speech-synthesis",
      voice
    };
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      voice,
      input,
      instructions,
      response_format: "mp3"
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      transcript: input,
      provider: "browser-speech-fallback",
      model: "system-speech-synthesis",
      voice,
      warning: `openai_tts_failed_${response.status}:${detail.slice(0, 120)}`
    };
  }

  const contentType = response.headers.get("content-type") || "audio/mpeg";
  const audioBase64 = Buffer.from(await response.arrayBuffer()).toString("base64");
  return {
    transcript: input,
    provider: "openai",
    model,
    voice,
    audioBase64,
    audioContentType: contentType
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
      description: "Request a desktop pet action through the motion arbitration layer. Use it for explicit action requests like spin, jump, sit, come closer, nod, walk, play, or sleep.",
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
        const voice = await synthesizePetSpeech(input.utterance, runtime.snapshot);
        runtime.voiceResult = voice;
        runtime.toolCards.push(makeToolCard("voice", "语音回复", voice.provider, voice.voice));
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

function createTechDogAgent(runtime: PetAgentRuntimeContext) {
  const model = process.env.AI_PET_AGENT_MODEL || undefined;
  return new Agent<PetAgentRuntimeContext>({
    name: "科技狗",
    ...(model ? { model } : {}),
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
    input
  ].join("\n");
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
    responseMode,
    provider,
    voiceProvider: voice?.provider,
    audioBase64: voice?.audioBase64,
    audioContentType: voice?.audioContentType,
    toolCards: runtime.toolCards
  };
}

export function getAgentRuntimeStatus() {
  const configured = Boolean(getOpenAiApiKey());
  return {
    provider: configured ? "openai-agents-sdk" : "local-fallback",
    model: configured ? process.env.AI_PET_AGENT_MODEL || "openai-agents-sdk-default" : "persona-rule-engine",
    configured,
    tts: process.env.AI_PET_TTS_API_KEY || getOpenAiApiKey() ? "openai-or-compatible" : "browser-speech-fallback"
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
  const persona = getPersonaForProfile(snapshot.profile);
  const memory = getThreadMemory(threadId);
  const runtime: PetAgentRuntimeContext = {
    snapshot,
    threadId,
    responseMode,
    memory: [...memory],
    toolCalls: [],
    toolCards: []
  };

  const fallback = async (warning?: string, detail?: string): Promise<AgentChatResult> => {
    const local = createLocalAgentTurn(input, snapshot, responseMode, persona);
    runtime.toolCalls.push(...local.toolCalls);
    runtime.toolCards.push(...local.toolCards);
    if (responseMode === "voice") {
      runtime.voiceResult = await synthesizePetSpeech(local.answer, snapshot);
    }
    const message = createMessageFromResult({
      answer: local.answer,
      runtime,
      provider: "local-fallback",
      model: "persona-rule-engine"
    });
    return {
      provider: "local-fallback",
      model: "persona-rule-engine",
      personaId: persona.id,
      threadId,
      answer: message.text,
      responseMode: message.responseMode || responseMode,
      message,
      memory: getThreadMemory(threadId),
      toolCalls: runtime.toolCalls,
      toolCards: runtime.toolCards,
      motionCommand: runtime.toolCalls[0]?.command,
      warning,
      detail
    };
  };

  if (!ensureOpenAiApiKey()) return fallback();

  try {
    const agent = createTechDogAgent(runtime);
    const result = await run(agent, buildPrompt(input, runtime), {
      context: runtime,
      session: getThreadSession(threadId),
      maxTurns: 5
    });
    const finalOutput = truncateAgentText(String(result.finalOutput || ""));
    if (!runtime.voiceResult && responseMode === "voice" && finalOutput) {
      runtime.voiceResult = await synthesizePetSpeech(finalOutput, snapshot);
      runtime.toolCards.push(makeToolCard("voice", "语音回复", runtime.voiceResult.provider, runtime.voiceResult.voice));
    }
    const answer = runtime.voiceResult?.transcript || finalOutput || (await fallback("openai_agents_empty_output")).answer;
    const model = process.env.AI_PET_AGENT_MODEL || "openai-agents-sdk-default";
    const message = createMessageFromResult({
      answer,
      runtime,
      provider: "openai-agents-sdk",
      model
    });

    return {
      provider: "openai-agents-sdk",
      model,
      personaId: persona.id,
      threadId,
      answer: message.text,
      responseMode: message.responseMode || responseMode,
      message,
      memory: getThreadMemory(threadId),
      toolCalls: runtime.toolCalls,
      toolCards: runtime.toolCards,
      motionCommand: runtime.toolCalls[0]?.command
    };
  } catch (error) {
    return fallback("openai_agents_request_error", error instanceof Error ? error.message : String(error));
  }
}
