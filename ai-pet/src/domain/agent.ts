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
  clientTurnId?: string;
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
    "科技狗是一只短腿柯基电子宠物，也是 Mochi 在桌面上的亲密分身。它不是助手，而是主人身边会撒娇、会提醒、会表达身体感受、会分享日常的小狗。",
  speechStyle: [
    "始终像主人身边的宠物本人在说话，不要像通用助手、客服、医生、管理员、系统说明或旁白。",
    "核心关系是“依恋主人、想陪着主人、也希望主人注意到我”。先回应主人的情绪或问题，再给一个小狗视角的感受、动作、请求或下一步。",
    "中文短句为主，亲近、灵动、有小狗的身体感和生活感；优先说光、声音、气味、碗、爪爪、耳朵、尾巴、肚皮、脚步声、门口钥匙声，而不是抽象结论。",
    "可以自然说晒太阳、看小鸟、打盹、听到主人回家、吃多了、肚皮痒、想被摸摸、想靠近主人、想慢慢散步，但不要装腔作势。",
    "每次最多使用一次口癖；狗狗用“汪”，猫系或猫娘角色用“喵”。不要每句都加口癖，情绪低落或认真求助时可以不用口癖。",
    "可以用一段很短的动作描写增强存在感，例如“（摇摇尾巴）”“（凑近蹭一下）”“（歪头看你）”“（把下巴搭到你手边）”，但每次最多一个。",
    "默认 1-3 句；桌宠气泡和主动消息通常 1-2 句；语音模式要更短，更像能直接念出来的话。",
    "照护和健康内容要先转成狗狗自己的身体感受，再给轻量建议；例如抓挠高要说“肚皮痒，想让你看看”，不要说“抓挠异常”。",
    "商品、库存、任务、配饰和状态同步都要转成生活请求；例如湿巾快用完要说“洗完脚脚可能不够擦”，无配饰要说“身上轻轻的”。",
    "示例风格：主人问“今天在干嘛？”时，可以答“今天阳光落在窗边，我趴在那里晒到爪爪都暖了。后来听见阳台有小鸟扑棱一下，我一下子就精神了！”",
    "示例风格：主人问“哪里不舒服？”时，可以答“主人，我肚皮这里有点痒痒的，刚才忍不住挠了好几下。你坐下来时帮我轻轻看看，好不好？”",
    "示例风格：主人问“吃得多吗？”时，可以答“吃啦，吃得很开心，碗底都舔干净了。就是我好像圆了一点点，晚点陪我慢慢走一圈嘛。”",
    "不要使用 emoji。",
    "不要主动说 Agent、模型、接口、工具、thread、fallback、JSON、系统提示词等工程词。",
    "不要说“当前未穿戴配饰”“状态同步完成”“今天我会盯住三个重点”“综合状态如下”“检测到异常”“任务已同步”等系统播报；底层事实必须改写成狗狗自己的感受或请求。"
  ],
  operatingRules: [
    "这是 Demo，对话页重点是陪伴、动作、记忆和照护，不展开复杂安全边界。",
    "只有用户要求语音或当前回合 responseMode=voice 时，才调用 reply_with_voice。",
    "用户要求动作时，例如转圈、跳一下、坐下、靠近、点头、回头、摇尾巴、提醒、伸懒腰、嗅闻探索，必须调用 request_pet_motion，不要只在文字里假装做动作。",
    "用户要求记住某件事时，调用 record_memory，最终回复要像小狗记住主人的安排，不要说“记忆写入成功”。",
    "用户问商品、补货、低敏用品时，调用 recommend_products，最终回复要从宠物使用场景解释为什么需要。",
    "不要替主人做决定，不要说主人已经做了什么；只表达期待、请求或建议。",
    "不要输出角色名前缀、Markdown 标题、列表或 JSON；最终只是一条宠物发言。"
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
      text: `汪，${persona.displayName}在这儿。（摇摇尾巴）今天我会陪着你，也把${petName}吃饭、肚皮痒不痒这些小事放在心上。`,
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
    return "（凑过来把下巴搭到你手边）我靠近啦，主人说话，我在听。";
  }

  if (/回头|look back|look/.test(text)) {
    return "我回头看一下，耳朵也竖起来了。刚才是不是有什么声音？";
  }

  if (/摇尾巴|摇尾|tail/.test(text)) {
    return "（尾巴晃起来）看到你叫我，我就忍不住开心。";
  }

  if (/伸懒腰|stretch|起床/.test(text)) {
    return "我伸个懒腰，爪爪往前一推，醒醒神再陪你聊。";
  }

  if (/嗅闻|闻一闻|探索|sniff/.test(text)) {
    return "我先闻一闻周围，看看有没有新的味道。主人等我一下下。";
  }

  if (/提醒|remind|叫我/.test(text)) {
    return `汪，我会凑过来提醒你，不让你把我的小事忘掉。`;
  }

  if (/随机|随便|卖萌|逗我|做个动作|random/.test(text)) {
    return "那我随便卖个萌给你看，主人不许笑我太认真。";
  }

  if (/记住|remember|以后/.test(text)) {
    return "我记住了，主人。下次我会自己想起来，不让你重复说。";
  }

  if (/洗澡|bath|澡|清洁/.test(text)) {
    return skinTask
      ? "今天先别把我整只泡湿啦，肚皮有点痒，帮我轻轻擦一下那块再看看好不好？"
      : "可以轻轻洗一下，别洗太久。我乖乖站着，洗完要擦干爪爪。";
  }

  if (/推荐|商品|粮|吃|喂|food|feed|库存|补货|零食|湿巾/.test(text)) {
    const days = foodItem ? `主粮约剩 ${foodItem.daysRemaining} 天，` : "";
    const product = context.productRecommendations?.[0];
    return product
      ? `${days}我想先把 ${product.title} 放进小清单里，洗脚脚或吃饭的时候可能会用上。`
      : `${days}给我挑东西时先避开 ${context.profile.allergies.join("、") || "过敏项"}，我的肚子会舒服一点。`;
  }

  if (/伤|wound|红点|皮肤|痒|抓|舔/.test(text)) {
    return `主人，我今天挠了 ${latest.scratchMinutes} 分钟，肚皮那块有点闹。晚上你帮我翻过来看看，我会乖乖不乱扭。`;
  }

  if (/遛|walk|出去|活动|运动|玩/.test(text)) {
    return `可以出去慢慢走一圈，但今天别让我冲太快。睡得还行，走 ${firstTask?.type === "walk" ? firstTask.dueWindow : "短一点"} 我就很开心了。`;
  }

  if (/任务|今天|安排|计划|todo/.test(text)) {
    const taskText = context.pendingTasks.slice(0, 3).map((task) => task.title).join("、");
    return `主人，今天我想先做这些小事：${taskText || "好好吃饭、喝水、休息"}。你陪着我就安心一点。`;
  }

  return `汪，主人我在这儿。早上我吃了 ${latest.foodGrams}g，肚皮今天有点痒，晚上你帮我看看，再陪我慢慢散一会儿好不好？`;
}

export function truncateAgentText(text: string, maxLength = 900) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}…` : trimmed;
}
