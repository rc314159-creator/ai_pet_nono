import "./env";
import cors from "cors";
import express from "express";
import { createPetAgentReply, createProactiveAgentMessage, getAgentRuntimeStatus } from "./agent";
import { getDesktopPetAppearance, isPetAccessoryId, updateDesktopPetAppearance } from "./appearance";
import {
  getKnowledgeBaseSnapshot,
  recordKnowledgeBaseEvent,
  recordKnowledgeBaseMemories,
  recordKnowledgeBaseMessages,
  subscribeKnowledgeBase
} from "./knowledgeBase";
import { getMotionSnapshot, submitAgentMotion, submitBraceletMirror, submitMotionCommand, submitRandomMotion } from "./motion";
import { getPetEventRuntimeStatus, handlePetRuntimeEvent, isPetEventKind, startPetEventRuntime, type PetEventKind } from "./petEventRuntime";
import { appendThreadMessages, getLatestPetThreadMessage, getThreadMemories, getThreadMessages, replaceThreadMemories } from "./threadStore";
import type { AgentChatMessage } from "../src/domain/agent";
import type { ExpressionCommand, PetMotionAction, StreamPacket, VirtualPetState } from "../src/domain/types";

const app = express();
const port = Number(process.env.AI_PET_API_PORT || 8788);
const llmBaseUrl = process.env.LLMMELON_BASE_URL || "https://llmmelon.cloud/v1";
const llmModel = process.env.LLMMELON_MODEL || "gpt-4o-mini";
const desktopRuntime = process.env.AI_PET_DESKTOP_RUNTIME || "desktop/photo-pet";

const allowedOrigins = new Set(["http://127.0.0.1:5180", "http://localhost:5180", "null"]);

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  }
}));
app.use(express.json({ limit: "1mb" }));

type AskPayload = {
  question?: string;
  context?: unknown;
};

function localAnswer(question: string) {
  const normalized = question.toLowerCase();
  if (/洗澡|bath|澡/.test(normalized)) {
    return "本地规则建议：今天不要直接安排完整洗澡。Mochi 最近抓挠时长高于基线，且有皮肤观察记录，优先做局部清洁、梳毛和皮肤复查；如果红肿扩大、渗液或持续 24 小时以上，建议联系兽医。";
  }
  if (/粮|吃|喂|food|feed|库存/.test(normalized)) {
    return "本地规则建议：主粮库存约 1.8 天，已经低于 3 天阈值。Mochi 有鸡肉过敏和肠胃敏感，补货应排除鸡肉配方，优先选择三文鱼或水解蛋白、脂肪含量适中的配方。";
  }
  if (/伤|wound|受伤|皮肤/.test(normalized)) {
    return "本地规则建议：先记录伤口位置、大小、颜色、是否渗液和宠物是否频繁舔咬。轻微表皮红点可以清洁观察；如果疼痛、肿胀、出血、渗液、精神下降或持续恶化，应尽快就医。";
  }
  if (/遛|walk|活动|运动/.test(normalized)) {
    return "本地规则建议：今天活动量比 7 日均值低约 28%，建议安排两段低到中等强度遛狗，总计 35-45 分钟。因为昨晚睡眠质量偏低，避免高强度奔跑。";
  }
  return "本地规则建议：我会综合宠物档案、今日活动、睡眠、皮肤观察和库存来回答。当前重点是补主粮、安排低强度活动、复查抓挠区域，并完成晚间喂食和换水。";
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    llm: process.env.LLMMELON_API_KEY ? "llmmelon-configured" : "local-fallback",
    model: process.env.LLMMELON_API_KEY ? llmModel : "rule-engine",
    desktopPet: desktopRuntime,
    desktopPetDisplayName: "旺财"
  });
});

app.get("/api/desktop-pet/status", (_req, res) => {
  res.json({
    configured: true,
    connected: true,
    runtime: desktopRuntime,
    appRunning: true,
    defaultPetVisible: true,
    speechBubblesEnabled: true,
    defaultPet: {
      id: "pet_mochi",
      displayName: "旺财",
      builtIn: false
    }
  });
});

app.get("/api/desktop-pet/motion", (_req, res) => {
  res.json(getMotionSnapshot());
});

app.get("/api/desktop-pet/appearance", (_req, res) => {
  res.json(getDesktopPetAppearance());
});

app.post("/api/desktop-pet/appearance", (req, res) => {
  const accessoryId = req.body?.accessoryId;
  if (!isPetAccessoryId(accessoryId)) {
    res.status(400).json({ ok: false, error: "supported_accessory_required" });
    return;
  }

  const petId = typeof req.body?.petId === "string" && req.body.petId.trim() ? req.body.petId.trim() : "pet_mochi";
  const appearance = updateDesktopPetAppearance(accessoryId, petId);
  void handlePetRuntimeEvent({
    kind: "appearance.changed",
    source: "appearance",
    payload: {
      petId: appearance.petId,
      accessoryId: appearance.accessoryId,
      accessoryLabel: appearance.accessoryLabel,
      eventKey: `appearance:${appearance.accessoryId}:${appearance.updatedAt}`
    }
  });
  recordKnowledgeBaseEvent({
    kind: "appearance_saved",
    accessoryId: appearance.accessoryId,
    accessoryLabel: appearance.accessoryLabel,
    source: "desktop-pet-appearance"
  });
  res.json(appearance);
});

app.post("/api/desktop-pet/motion/bracelet", (req, res) => {
  const packet = req.body?.packet as StreamPacket | undefined;
  const state = req.body?.state as VirtualPetState | undefined;
  if (!packet?.timestamp || !packet.activityState) {
    res.status(400).json({ ok: false, error: "packet_required" });
    return;
  }
  res.json(submitBraceletMirror(packet, state));
});

app.post("/api/desktop-pet/motion", (req, res) => {
  const command = req.body?.command as ExpressionCommand | undefined;
  if (command?.target === "desktop_pet" && command.action && command.source) {
    res.json(submitMotionCommand(command));
    return;
  }

  const source = String(req.body?.source || "").trim();
  const action = String(req.body?.action || "").trim() as PetMotionAction;
  const reason = String(req.body?.reason || "").trim() || "manual desktop pet motion request";

  if (source === "agent_tool_call" && action) {
    res.json(submitAgentMotion(action, reason, req.body?.context));
    return;
  }

  if (source === "random_action") {
    res.json(submitRandomMotion(reason));
    return;
  }

  res.status(400).json({ ok: false, error: "motion_command_required" });
});

app.post("/api/desktop-pet/say", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  if (!message) {
    res.status(400).json({ ok: false, error: "message_required" });
    return;
  }

  const now = new Date().toISOString();
  const petMessage: AgentChatMessage = {
    id: `desktop_pet_say_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    speaker: "pet",
    authorName: "旺财",
    text: message,
    createdAt: now,
    provider: "desktop/photo-pet"
  };
  appendThreadMessages("pet_mochi_main", [petMessage]);
  recordKnowledgeBaseMessages("pet_mochi_main", [petMessage]);
  res.json({
    ok: true,
    runtime: desktopRuntime,
    message: "Desktop photo pet bubble queued.",
    bubble: {
      id: petMessage.id,
      text: petMessage.text,
      createdAt: petMessage.createdAt
    }
  });
});

app.get("/api/desktop-pet/bubble", (req, res) => {
  const threadId = String(req.query.threadId || "pet_mochi_main").trim() || "pet_mochi_main";
  const message = getLatestPetThreadMessage(threadId);
  if (!message) {
    res.json({
      threadId,
      message: undefined
    });
    return;
  }

  res.json({
    threadId,
    message: {
      id: message.id,
      text: message.text,
      authorName: message.authorName,
      provider: message.provider,
      createdAt: message.createdAt
    }
  });
});

app.get("/api/agent/status", (_req, res) => {
  res.json({
    ...getAgentRuntimeStatus(),
    petEventRuntime: getPetEventRuntimeStatus()
  });
});

app.post("/api/agent/hooks", async (req, res) => {
  try {
    const kind = String(req.body?.kind || "").trim();
    if (!isPetEventKind(kind)) {
      res.status(400).json({ error: "supported_pet_event_kind_required" });
      return;
    }

    const result = await handlePetRuntimeEvent({
      kind: kind as PetEventKind,
      source: typeof req.body?.source === "string" ? req.body.source : "api-hook",
      payload: req.body?.payload && typeof req.body.payload === "object" ? req.body.payload : undefined,
      createdAt: typeof req.body?.createdAt === "string" ? req.body.createdAt : undefined
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post("/api/agent/timer/tick", async (req, res) => {
  try {
    const result = await handlePetRuntimeEvent({
      kind: "cron.companion_checkin",
      source: "manual-cron",
      createdAt: typeof req.body?.createdAt === "string" ? req.body.createdAt : undefined
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.post("/api/agent/cron/tick", async (req, res) => {
  try {
    const result = await handlePetRuntimeEvent({
      kind: "cron.companion_checkin",
      source: "manual-cron",
      payload: req.body?.payload && typeof req.body.payload === "object" ? req.body.payload : undefined,
      createdAt: typeof req.body?.createdAt === "string" ? req.body.createdAt : undefined
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get("/api/knowledge-base", (_req, res) => {
  res.json(getKnowledgeBaseSnapshot());
});

app.get("/api/knowledge-base/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });

  const sendSnapshot = (snapshot = getKnowledgeBaseSnapshot()) => {
    res.write(`event: snapshot\n`);
    res.write(`data: ${JSON.stringify(snapshot)}\n\n`);
  };
  const unsubscribe = subscribeKnowledgeBase(sendSnapshot);
  const heartbeat = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 25000);

  sendSnapshot();

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

app.post("/api/knowledge-base/events", (req, res) => {
  try {
    const kind = String(req.body?.kind || "").trim();
    if (!kind) {
      res.status(400).json({ error: "kind_required" });
      return;
    }

    const snapshot = recordKnowledgeBaseEvent({
      kind: kind as Parameters<typeof recordKnowledgeBaseEvent>[0]["kind"],
      title: typeof req.body?.title === "string" ? req.body.title : undefined,
      detail: typeof req.body?.detail === "string" ? req.body.detail : undefined,
      source: typeof req.body?.source === "string" ? req.body.source : undefined,
      tags: Array.isArray(req.body?.tags) ? req.body.tags.map(String) : undefined,
      importance: req.body?.importance,
      task: req.body?.task
    });
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get("/api/agent/threads/:threadId/messages", (req, res) => {
  const threadId = String(req.params.threadId || "").trim();
  if (!threadId) {
    res.status(400).json({ error: "thread_required" });
    return;
  }

  res.json({
    threadId,
    messages: getThreadMessages(threadId),
    memory: getThreadMemories(threadId)
  });
});

app.post("/api/agent/threads/:threadId/proactive", (req, res) => {
  try {
    const result = createProactiveAgentMessage({
      threadId: String(req.params.threadId || "").trim(),
      context: req.body?.context
    });
    const motion = result.motionCommand ? submitMotionCommand(result.motionCommand) : getMotionSnapshot();
    if (result.message) recordKnowledgeBaseMessages(result.threadId, [result.message]);
    res.json({ ...result, motion });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(message === "context_required" ? 400 : 500).json({
      error: message
    });
  }
});

app.post("/api/agent/chat", async (req, res) => {
  try {
    const requestedThreadId = String(req.body?.threadId || req.body?.context?.mainThreadId || "pet_mochi_main").trim() || "pet_mochi_main";
    const clientMessageId =
      typeof req.body?.clientMessageId === "string" && req.body.clientMessageId.trim()
        ? req.body.clientMessageId.trim().slice(0, 160)
        : `user-${new Date().toISOString()}-${Math.random().toString(16).slice(2, 8)}`;
    const clientTurnId =
      typeof req.body?.clientTurnId === "string" && req.body.clientTurnId.trim()
        ? req.body.clientTurnId.trim().slice(0, 160)
        : clientMessageId;
    const clientCreatedAt =
      typeof req.body?.clientCreatedAt === "string" && !Number.isNaN(new Date(req.body.clientCreatedAt).getTime())
        ? req.body.clientCreatedAt
        : new Date().toISOString();
    const existingMessages = getThreadMessages(requestedThreadId);
    const existingUser = existingMessages.find((message) => message.id === clientMessageId);
    const existingPet = existingMessages.find((message) => message.speaker === "pet" && message.clientTurnId === clientTurnId);
    if (existingUser && existingPet) {
      res.json({
        provider: existingPet.provider || "thread-store",
        model: "thread-store",
        personaId: "existing-turn",
        threadId: requestedThreadId,
        answer: existingPet.text,
        responseMode: existingPet.responseMode || "text",
        message: existingPet,
        memory: getThreadMemories(requestedThreadId),
        toolCalls: [],
        toolCards: existingPet.toolCards || []
      });
      return;
    }

    req.body.clientMessageId = clientMessageId;
    req.body.clientTurnId = clientTurnId;
    req.body.clientCreatedAt = clientCreatedAt;
    const result = await createPetAgentReply(req.body);
    const userMessage: AgentChatMessage = {
      id: clientMessageId,
      speaker: "user",
      authorName: "主人",
      text: String(req.body?.input || "").trim(),
      createdAt: clientCreatedAt,
      clientTurnId,
      responseMode: "text"
    };
    appendThreadMessages(result.threadId, [userMessage, result.message]);
    replaceThreadMemories(result.threadId, result.memory);
    recordKnowledgeBaseMessages(result.threadId, [userMessage, result.message]);
    recordKnowledgeBaseMemories(result.threadId, result.memory);
    const motionCommands = result.motionCommands || (result.motionCommand ? [result.motionCommand] : []);
    const motion = motionCommands.length
      ? motionCommands.reduce((_snapshot, command) => submitMotionCommand(command), getMotionSnapshot())
      : getMotionSnapshot();
    res.json({ ...result, motion });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(message === "input_required" || message === "context_required" ? 400 : 500).json({
      error: message
    });
  }
});

app.post("/api/ask", async (req, res) => {
  const payload = req.body as AskPayload;
  const question = String(payload.question || "").trim();
  if (!question) {
    res.status(400).json({ error: "question_required" });
    return;
  }

  const apiKey = process.env.LLMMELON_API_KEY;
  if (!apiKey) {
    res.json({ provider: "local-fallback", answer: localAnswer(question) });
    return;
  }

  try {
    const response = await fetch(`${llmBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: llmModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "你是 AI Pet 的宠物照护助手。只基于提供的宠物档案、设备数据、库存和任务回答。不要做兽医诊断，不要开处方；涉及受伤、疾病、用药时给风险提示和就医边界。商品推荐必须解释触发原因和禁忌检查。"
          },
          {
            role: "user",
            content: JSON.stringify({ question, context: payload.context }, null, 2)
          }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      res.json({
        provider: "local-fallback",
        warning: `llmmelon_failed_${response.status}`,
        detail: text.slice(0, 160),
        answer: localAnswer(question)
      });
      return;
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = data.choices?.[0]?.message?.content?.trim() || localAnswer(question);
    res.json({ provider: "llmmelon", model: llmModel, answer });
  } catch (error) {
    res.json({
      provider: "local-fallback",
      warning: "llmmelon_request_error",
      detail: error instanceof Error ? error.message : String(error),
      answer: localAnswer(question)
    });
  }
});

app.listen(port, "127.0.0.1", () => {
  console.log(`AI Pet API listening on http://127.0.0.1:${port}`);
  startPetEventRuntime();
});
