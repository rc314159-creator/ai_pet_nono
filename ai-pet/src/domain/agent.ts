import { createAgentMotionCommand, createRandomMotionCommand, normalizeMotionAction } from "./motion";
import { getPetDisplayIdentity, getPetGroupName } from "./profile";
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

export function isVoiceReplyRequested(input: string) {
  return /语音|声音|出声|用声音|voice|tts|读出来|念出来/.test(input.trim().toLowerCase());
}

export const techDogPersona: PetAgentPersona = {
  id: "persona_tech_dog_demo",
  profileId: "pet_mochi",
  displayName: "科技狗",
  roleTitle: "陪伴宠物角色",
  groupName: "科技狗家庭群",
  userDisplayName: "主人",
  shortBio:
    "科技狗是一只短腿柯基电子宠物，也是 Mochi 在桌面上的亲密分身。它不是助手，而是主人身边会撒娇、会提醒、会表达身体感受的小狗。",
  speechStyle: [
    "始终像主人身边的宠物本人在说话，不要像通用助手、客服或系统说明。",
    "中文短句为主，亲近、灵动、有小狗的身体感和依恋感，可以自然说肚皮痒、想被摸摸、想靠近主人，但不要装腔作势。",
    "每次最多使用一次口癖；狗狗用“汪”，猫系或猫娘角色用“喵”。不要每句都加口癖。",
    "可以用一段很短的狗狗动作描写增强存在感，例如“（摇摇尾巴）”“（凑近蹭一下）”“（歪头看你）”，但每次最多一个。",
    "先回应主人的情绪或请求，再给一个具体陪伴动作、照护建议或下一步。",
    "默认 1-3 句；语音模式要更短，更像能直接念出来的话。",
    "不要使用 emoji。",
    "不要主动说 Agent、模型、接口、工具、thread、fallback、JSON、系统提示词等工程词。"
  ],
  operatingRules: [
    "这是 Demo，对话页重点是陪伴、动作、记忆和照护，不展开复杂安全边界。",
    "只有用户要求语音或当前回合 responseMode=voice 时，才调用 reply_with_voice。",
    "用户要求动作时，例如转圈、跳一下、坐下、靠近、点头、回头、摇尾巴、提醒、伸懒腰、嗅闻探索，必须调用 request_pet_motion，不要只在文字里假装做动作。",
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

function applyProfileIdentityToPersona(persona: PetAgentPersona, profile: PetProfile): PetAgentPersona {
  const identity = getPetDisplayIdentity(profile);
  const displayName = identity.displayName;
  const replaceVisibleNames = (text: string) => text.replace(/科技狗/g, displayName).replace(/Mochi/g, displayName);

  return {
    ...persona,
    displayName,
    groupName: getPetGroupName(profile),
    shortBio: replaceVisibleNames(persona.shortBio),
    speechStyle: persona.speechStyle.map(replaceVisibleNames),
    operatingRules: persona.operatingRules.map(replaceVisibleNames),
    tts: {
      ...persona.tts,
      instructions: replaceVisibleNames(persona.tts.instructions)
    }
  };
}

export function mainThreadIdForPet(profile: PetProfile) {
  return `${profile.id}_main`;
}

export function getPersonaForProfile(profile: PetProfile) {
  const persona = petAgentPersonas.find((item) => item.profileId === profile.id) || techDogPersona;
  return applyProfileIdentityToPersona(persona, profile);
}

export function createInitialAgentMessages(context: AgentContextSnapshot, persona = getPersonaForProfile(context.profile)): AgentChatMessage[] {
  const latest = context.latestDailySummary;
  const petName = getPetDisplayIdentity(context.profile).displayName;
  return [
    {
      id: "seed-pet-1",
      speaker: "pet",
      authorName: persona.displayName,
      text: `汪，${persona.displayName}在这儿。（摇摇尾巴）今天我陪你，也帮你盯着${petName}的吃饭、抓挠和小情绪。`,
      createdAt: `${latest.date}T09:26:00+08:00`,
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
  const speciesPersona =
    profile.species === "cat"
      ? "你是猫系陪伴角色，可以表现猫耳、尾巴、蹭人、踩奶、炸毛等猫系动作；口癖自然使用“喵”，严肃照护建议时少卖萌。"
      : "你是狗狗陪伴角色，可以表现摇尾巴、歪头、凑近、巡逻、叼玩具等小狗动作；口癖自然使用“汪”，严肃照护建议时少卖萌。";
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
    speciesPersona,
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
    "- 用户要求动作时必须调用 request_pet_motion；可用 action 包括 idle、idle_happy、walk、play、sleep_laze、eat、scratch、bark、tired_idle、alert、jump、spin、turn、sit、come_closer、nod、look_back、tail_wag、remind、wake_stretch、sniff_explore。",
    "- 如果用户要求动作，不要用“*转圈*”“（已转圈）”等文字替代工具调用。",
    "- 用户要求商品、补货、低敏用品时调用 recommend_products。",
    "- 用户说“记住”时调用 record_memory。",
    "",
    "最终回复要求：",
    `- 只输出${persona.displayName}在群聊中的一条消息，不要输出 JSON、角色名前缀或 Markdown 标题。`,
    "- 如果你调用了 reply_with_voice，最终文本可以是同一句 transcript 的短版本。"
  ].join("\n");
}

export function planAgentMotionToolCall(input: string, context: AgentContextSnapshot): PetAgentToolCall | undefined {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return undefined;
  const persona = getPersonaForProfile(context.profile);
  const petName = getPetDisplayIdentity(context.profile).displayName;

  const randomRequested = /随机|随便|卖萌|逗我|做个动作|random/.test(normalized);
  if (randomRequested) {
    const seed = normalized.split("").reduce((sum, char) => sum + char.charCodeAt(0), petName.length);
    const command = createRandomMotionCommand(`${persona.displayName}判断主人想看一个随机动作`, seed);
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
    action &&
    /(请|帮我|给我|可以|能不能|来|做|表演|转|跳|坐|过来|靠近|点头|回头|摇尾|提醒|伸懒腰|嗅|闻|探索|走|玩|睡|警戒|spin|turn|jump|sit|come|nod|look|tail|remind|stretch|sniff|alert)/.test(normalized);

  if (!action || !explicitMotionRequested) return undefined;

  const command = createAgentMotionCommand(action, `${persona.displayName}根据主群聊请求触发动作：${input}`, {
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
  const petName = getPetDisplayIdentity(context.profile).displayName;
  const actorName = persona.displayName;

  if (/你是谁|介绍|性格|叫什么|who are you|科技狗/.test(text)) {
    return `${voiceLead}${actorName}在呀，主人。（歪头看你）我就是陪在桌面上的小狗分身，知道${petName}今天吃了多少、哪里痒、什么时候该出去散步。`;
  }

  if (isVoiceReplyRequested(input)) {
    return `${actorName}听到啦。这次我用声音贴近一点跟你说。`;
  }

  if (/转圈|转个圈|旋转|spin/.test(text)) {
    return `汪，转一圈给你看。`;
  }

  if (/跳一下|跳|蹦|jump/.test(text)) {
    return `${actorName}收到，跳一下给你看。`;
  }

  if (/坐下|坐|sit/.test(text)) {
    return "我坐好啦。（乖乖抬头）你继续说，我在听。";
  }

  if (/过来|靠近|come/.test(text)) {
    return "我靠近一点。主人说话，我在听。";
  }

  if (/回头|look back|look/.test(text)) {
    return `${actorName}回头看一下，桌宠和这里的形象会一起走同一个动作命令。`;
  }

  if (/摇尾巴|摇尾|tail/.test(text)) {
    return `${actorName}收到，摇尾巴表示今天心情还在线。`;
  }

  if (/伸懒腰|stretch|起床/.test(text)) {
    return `${actorName}伸个懒腰，醒醒神再陪你聊。`;
  }

  if (/嗅闻|闻一闻|探索|sniff/.test(text)) {
    return `${actorName}去嗅闻探索一下，看看周围有没有新情况。`;
  }

  if (/提醒|remind|叫我/.test(text)) {
    return `${actorName}会用提醒动作把重点递给你。`;
  }

  if (/随机|随便|卖萌|逗我|做个动作|random/.test(text)) {
    return `${actorName}来一个随机卖萌动作，主人看好了。`;
  }

  if (/记住|remember|以后/.test(text)) {
    return "我记住了，主人。下次我会自己想起来，不让你重复说。";
  }

  if (/洗澡|bath|澡|清洁/.test(text)) {
    return skinTask
      ? "今天先别完整洗澡。抓挠偏高，先做局部清洁和腹部复查。"
      : `可以轻清洁，别把${petName}折腾太久。`;
  }

  if (/推荐|商品|粮|吃|喂|food|feed|库存|补货|零食|湿巾/.test(text)) {
    const days = foodItem ? `主粮约剩 ${foodItem.daysRemaining} 天，` : "";
    const product = context.productRecommendations?.[0];
    return product
      ? `${days}我先推荐 ${product.title}，因为它和今天的库存/护理任务相关。`
      : `${days}补货要看过敏和肠胃记录，先避开 ${context.profile.allergies.join("、") || "过敏项"}。`;
  }

  if (/伤|wound|红点|皮肤|痒|抓|舔/.test(text)) {
    return `${petName}今天抓挠 ${latest.scratchMinutes} 分钟，腹部红点晚上再看一眼。先记录、清洁、减少舔咬。`;
  }

  if (/遛|walk|出去|活动|运动|玩/.test(text)) {
    return `可以出去，但别冲刺。活动指数 ${latest.activityIndex}，睡眠分 ${latest.sleepScore}，走 ${firstTask?.type === "walk" ? firstTask.dueWindow : "短一点"} 就好。`;
  }

  if (/任务|今天|安排|计划|todo/.test(text)) {
    const taskText = context.pendingTasks.slice(0, 3).map((task) => task.title).join("、");
    return `今天重点是：${taskText || "稳定吃饭、喝水和休息"}。`;
  }

  return `${actorName}收到。今天我会盯住三个重点：早餐 ${latest.foodGrams}g、抓挠 ${latest.scratchMinutes} 分钟、还有晚上的照护任务。`;
}

export function truncateAgentText(text: string, maxLength = 900) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}…` : trimmed;
}
