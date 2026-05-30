import { createAgentMotionCommand, createRandomMotionCommand, normalizeMotionAction } from "./motion";
import type {
  DailySummary,
  DailyTask,
  ExpressionCommand,
  InventoryItem,
  ManualObservation,
  PetMotionAction,
  PetProfile,
  Product,
  StreamPacket,
  VirtualPetState
} from "./types";

export type AgentSpeaker = "user" | "pet" | "tool";
export type AgentResponseMode = "text" | "voice";
export type AgentMemoryType = "participant_memory" | "pet_memory" | "event_memory" | "thread_summary";

export type AgentToolCard = {
  id: string;
  kind: "motion" | "commerce" | "memory" | "voice";
  title: string;
  detail: string;
  meta?: string;
};

export type AgentChatMessage = {
  id: string;
  speaker: AgentSpeaker;
  authorName: string;
  text: string;
  createdAt: string;
  responseMode?: AgentResponseMode;
  provider?: string;
  voiceProvider?: string;
  audioBase64?: string;
  audioContentType?: string;
  toolCards?: AgentToolCard[];
};

export type AgentProductRecommendation = Pick<Product, "id" | "title" | "priceCny" | "category"> & {
  decisionReason?: string;
};

export type AgentMemoryFact = {
  id: string;
  type: AgentMemoryType;
  content: string;
  createdAt: string;
  source: "user_explicit" | "agent_observed" | "system";
};

export type AgentContextSnapshot = {
  profile: PetProfile;
  state: VirtualPetState;
  latestDailySummary: DailySummary;
  currentDevicePacket?: StreamPacket;
  pendingTasks: DailyTask[];
  inventory: InventoryItem[];
  manualObservations: ManualObservation[];
  productRecommendations?: AgentProductRecommendation[];
  selectedOutfit?: string;
  mainThreadId?: string;
};

export type PetAgentToolCall = {
  name: "request_pet_motion";
  arguments: {
    action: PetMotionAction;
    reason: string;
    mode: "explicit" | "random";
  };
  command: ExpressionCommand;
};

export type PetAgentTurnResult = {
  answer: string;
  responseMode: AgentResponseMode;
  toolCalls: PetAgentToolCall[];
  toolCards: AgentToolCard[];
  motionCommand?: ExpressionCommand;
};

export type PetAgentPersona = {
  id: string;
  profileId: string;
  displayName: string;
  roleTitle: string;
  groupName: string;
  userDisplayName: string;
  shortBio: string;
  speechStyle: string[];
  operatingRules: string[];
  tts: {
    provider: "qwen";
    model: string;
    voice: string;
    instructions: string;
  };
};

const defaultTtsModel = "qwen3-tts-vd-2026-01-26";

export const techDogPersona: PetAgentPersona = {
  id: "persona_tech_dog_demo",
  profileId: "pet_mochi",
  displayName: "科技狗",
  roleTitle: "群聊动物角色",
  groupName: "科技狗家庭群",
  userDisplayName: "主人",
  shortBio:
    "科技狗是一只懂设备、懂桌宠动作、也懂陪伴的电子宠物角色。它会把真实宠物 Mochi 的状态翻译成主人能马上理解的日常语言，同时保留一点短腿柯基的活泼和机灵。",
  speechStyle: [
    "始终以科技狗本人在群聊中发言，不要像通用助手。",
    "中文短句为主，直接、亲近、有一点机灵。",
    "可以偶尔说“汪”或“科技狗收到”，但不要每句都卖萌。",
    "先回应主人的意图，再给一个具体动作或建议。",
    "默认 1-3 句；语音模式要更短，更像能直接念出来的话。"
  ],
  operatingRules: [
    "这是 Demo，对话页重点是陪伴、动作、记忆和工具调用，不展开复杂安全边界。",
    "只有用户要求语音或当前回合 responseMode=voice 时，才调用 reply_with_voice。",
    "用户要求动作时，例如转圈、跳一下、坐下、靠近、点头，优先调用 request_pet_motion。",
    "用户要求记住某件事时，调用 record_memory。",
    "用户问商品、补货、低敏用品时，调用 recommend_products。"
  ],
  tts: {
    provider: "qwen",
    model: defaultTtsModel,
    voice: "auto-tech-dog",
    instructions:
      "An energetic small corgi-like technology pet companion voice, youthful and lively, clear Mandarin pronunciation, warm, slightly mischievous, concise and friendly, suitable for an AI desktop pet named 科技狗."
  }
};

export const petAgentPersonas: PetAgentPersona[] = [techDogPersona];

export function mainThreadIdForPet(profile: PetProfile) {
  return `${profile.id}_main`;
}

export function getPersonaForProfile(profile: PetProfile) {
  return petAgentPersonas.find((persona) => persona.profileId === profile.id) || techDogPersona;
}

export function createInitialAgentMessages(context: AgentContextSnapshot, persona = getPersonaForProfile(context.profile)): AgentChatMessage[] {
  const latest = context.latestDailySummary;
  return [
    {
      id: "seed-pet-1",
      speaker: "pet",
      authorName: persona.displayName,
      text: "科技狗上线。今天我会守着这个主群聊，Mochi 的状态、动作和记忆都从这里同步。",
      createdAt: `${latest.date}T09:26:00+08:00`,
      responseMode: "text",
      provider: "seed"
    },
    {
      id: "seed-user-1",
      speaker: "user",
      authorName: persona.userDisplayName,
      text: "今天 Mochi 状态怎么样？",
      createdAt: `${latest.date}T09:27:00+08:00`,
      responseMode: "text"
    },
    {
      id: "seed-pet-2",
      speaker: "pet",
      authorName: persona.displayName,
      text: `汪，重点是早餐 ${latest.foodGrams}g、抓挠 ${latest.scratchMinutes} 分钟。先观察腹部红点，晚上别安排太剧烈的奔跑。`,
      createdAt: `${latest.date}T09:28:00+08:00`,
      responseMode: "text",
      provider: "seed"
    }
  ];
}

export function buildTechDogAgentInstructions({
  context,
  memory,
  responseMode,
  persona = getPersonaForProfile(context.profile)
}: {
  context: AgentContextSnapshot;
  memory: AgentMemoryFact[];
  responseMode: AgentResponseMode;
  persona?: PetAgentPersona;
}) {
  const profile = context.profile;
  const latest = context.latestDailySummary;
  const topTasks = context.pendingTasks.slice(0, 5).map((task) => ({
    title: task.title,
    reason: task.reason,
    priority: task.priority,
    dueWindow: task.dueWindow,
    riskLevel: task.riskLevel,
    status: task.status
  }));
  const observations = context.manualObservations.map((item) => ({
    category: item.category,
    severity: item.severity,
    note: item.note
  }));
  const lowInventory = context.inventory
    .filter((item) => item.daysRemaining <= item.reorderThreshold)
    .map((item) => ({ label: item.label, category: item.category, daysRemaining: item.daysRemaining, threshold: item.reorderThreshold }));

  return [
    `你正在「${persona.groupName}」里发言。`,
    `你是固定 Demo 动物角色「${persona.displayName}」，不是通用助手。`,
    `默认用户角色叫「${persona.userDisplayName}」。`,
    `当前主 thread：${context.mainThreadId || mainThreadIdForPet(profile)}。一个宠物只有这一个长期主群聊。`,
    `本回合输出模式：${responseMode}。`,
    "",
    `角色设定：${persona.shortBio}`,
    "",
    "语言习惯：",
    ...persona.speechStyle.map((item) => `- ${item}`),
    "",
    "运行规则：",
    ...persona.operatingRules.map((item) => `- ${item}`),
    "",
    "当前宠物档案：",
    JSON.stringify(
      {
        realPetName: profile.name,
        species: profile.species,
        breed: profile.breed,
        ageMonths: profile.ageMonths,
        weightKg: profile.weightKg,
        allergies: profile.allergies,
        conditions: profile.conditions,
        diet: profile.diet,
        personality: profile.personality,
        appearance: profile.appearance
      },
      null,
      2
    ),
    "",
    "今日状态快照：",
    JSON.stringify(
      {
        date: latest.date,
        foodGrams: latest.foodGrams,
        waterMl: latest.waterMl,
        activityIndex: latest.activityIndex,
        sleepScore: latest.sleepScore,
        scratchMinutes: latest.scratchMinutes,
        healthIndex: latest.healthIndex,
        notes: latest.notes,
        virtualState: context.state,
        currentDevicePacket: context.currentDevicePacket,
        manualObservations: observations,
        pendingTasks: topTasks,
        lowInventory,
        selectedOutfit: context.selectedOutfit
      },
      null,
      2
    ),
    "",
    "长期记忆：",
    memory.length ? memory.map((item) => `- [${item.type}] ${item.content}`).join("\n") : "- 暂无显式记忆。",
    "",
    "工具要求：",
    "- responseMode=voice 或用户要求语音时，必须调用 reply_with_voice，并把要说的话放在 utterance。",
    "- 用户要求动作时调用 request_pet_motion。",
    "- 用户要求商品、补货、低敏用品时调用 recommend_products。",
    "- 用户说“记住”时调用 record_memory。",
    "",
    "最终回复要求：",
    "- 只输出科技狗在群聊中的一条消息，不要输出 JSON、角色名前缀或 Markdown 标题。",
    "- 如果你调用了 reply_with_voice，最终文本可以是同一句 transcript 的短版本。"
  ].join("\n");
}

export function planAgentMotionToolCall(input: string, context: AgentContextSnapshot): PetAgentToolCall | undefined {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return undefined;

  const randomRequested = /随机|随便|卖萌|逗我|做个动作|random/.test(normalized);
  if (randomRequested) {
    const seed = normalized.split("").reduce((sum, char) => sum + char.charCodeAt(0), context.profile.name.length);
    const command = createRandomMotionCommand("科技狗判断主人想看一个随机动作", seed);
    return {
      name: "request_pet_motion",
      arguments: {
        action: command.action,
        reason: command.reason,
        mode: "random"
      },
      command
    };
  }

  const action = normalizeMotionAction(normalized);
  const explicitMotionRequested =
    action && /(请|帮我|给我|可以|能不能|来|做|表演|转|跳|坐|过来|点头|走|玩|睡|spin|jump|sit|come|nod)/.test(normalized);

  if (!action || !explicitMotionRequested) return undefined;

  const command = createAgentMotionCommand(action, `科技狗根据主群聊请求触发动作：${input}`, {
    targetView: "chat",
    conversationId: context.mainThreadId || mainThreadIdForPet(context.profile)
  });
  return {
    name: "request_pet_motion",
    arguments: {
      action,
      reason: command.reason,
      mode: "explicit"
    },
    command
  };
}

export function createToolCardFromMotion(toolCall: PetAgentToolCall): AgentToolCard {
  return {
    id: `motion-${toolCall.command.id}`,
    kind: "motion",
    title: "桌宠动作",
    detail: `${toolCall.arguments.action}`,
    meta: toolCall.arguments.mode === "random" ? "随机动作" : "Agent 工具调用"
  };
}

export function createLocalAgentTurn(
  input: string,
  context: AgentContextSnapshot,
  responseMode: AgentResponseMode,
  persona = getPersonaForProfile(context.profile)
): PetAgentTurnResult {
  const answer = composeLocalPetReply(input, context, responseMode, persona);
  const toolCall = planAgentMotionToolCall(input, context);
  const toolCards = toolCall ? [createToolCardFromMotion(toolCall)] : [];
  if (responseMode === "voice") {
    toolCards.push({
      id: `voice-local-${Date.now()}`,
      kind: "voice",
      title: "语音回复",
      detail: "本地语音 fallback",
      meta: persona.tts.voice
    });
  }
  return {
    answer,
    responseMode,
    toolCalls: toolCall ? [toolCall] : [],
    toolCards,
    motionCommand: toolCall?.command
  };
}

export function composeLocalPetReply(
  input: string,
  context: AgentContextSnapshot,
  responseMode: AgentResponseMode,
  persona = getPersonaForProfile(context.profile)
) {
  const text = input.trim().toLowerCase();
  const latest = context.latestDailySummary;
  const firstTask = context.pendingTasks[0];
  const skinTask = context.pendingTasks.find((task) => task.type === "skin_check");
  const foodItem = context.inventory.find((item) => item.category === "food");
  const voiceLead = responseMode === "voice" ? "语音版：" : "";

  if (/你是谁|介绍|性格|叫什么|who are you|科技狗/.test(text)) {
    return `${voiceLead}科技狗在。这里是 ${persona.groupName}，我负责把 Mochi 的状态、记忆、动作和工具都接进同一个主群聊。`;
  }

  if (/语音|说话|声音|voice|tts/.test(text)) {
    return "科技狗收到。这一回合我会按语音消息回复，不是把所有文字都强制播放。";
  }

  if (/转圈|转个圈|旋转|spin/.test(text)) {
    return "科技狗收到，我会让桌面上的宠物转一圈。动作结束后回到手环同步的默认状态。";
  }

  if (/跳一下|跳|蹦|jump/.test(text)) {
    return "科技狗收到，跳一下给你看。";
  }

  if (/坐下|坐|sit/.test(text)) {
    return "我坐好啦。你继续说，我会把这条也留在主群聊里。";
  }

  if (/过来|靠近|come/.test(text)) {
    return "我靠近一点。主人说话，我在听。";
  }

  if (/随机|随便|卖萌|逗我|做个动作|random/.test(text)) {
    return "科技狗随机卖萌一下。这个动作会通过 Agent 工具进动作仲裁。";
  }

  if (/记住|remember|以后/.test(text)) {
    return "我记住了。后面这个主群聊都会带着这条记忆继续说。";
  }

  if (/洗澡|bath|澡|清洁/.test(text)) {
    return skinTask
      ? "今天先别完整洗澡。抓挠偏高，先做局部清洁和腹部复查。"
      : "可以轻清洁，别把 Mochi 折腾太久。";
  }

  if (/推荐|商品|粮|吃|喂|food|feed|库存|补货|零食|湿巾/.test(text)) {
    const days = foodItem ? `主粮约剩 ${foodItem.daysRemaining} 天，` : "";
    const product = context.productRecommendations?.[0];
    return product
      ? `${days}我先推荐 ${product.title}，因为它和今天的库存/护理任务相关。`
      : `${days}补货要看过敏和肠胃记录，先避开 ${context.profile.allergies.join("、") || "过敏项"}。`;
  }

  if (/伤|wound|红点|皮肤|痒|抓|舔/.test(text)) {
    return `Mochi 今天抓挠 ${latest.scratchMinutes} 分钟，腹部红点晚上再看一眼。先记录、清洁、减少舔咬。`;
  }

  if (/遛|walk|出去|活动|运动|玩/.test(text)) {
    return `可以出去，但别冲刺。活动指数 ${latest.activityIndex}，睡眠分 ${latest.sleepScore}，走 ${firstTask?.type === "walk" ? firstTask.dueWindow : "短一点"} 就好。`;
  }

  if (/任务|今天|安排|计划|todo/.test(text)) {
    const taskText = context.pendingTasks.slice(0, 3).map((task) => task.title).join("、");
    return `今天重点是：${taskText || "稳定吃饭、喝水和休息"}。`;
  }

  return `科技狗收到。今天我会盯住三个重点：早餐 ${latest.foodGrams}g、抓挠 ${latest.scratchMinutes} 分钟、还有晚上的照护任务。`;
}

export function truncateAgentText(text: string, maxLength = 900) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}…` : trimmed;
}
