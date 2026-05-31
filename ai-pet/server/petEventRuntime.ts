import { getPersonaForProfile, mainThreadIdForPet, truncateAgentText } from "../src/domain/agent";
import { createAgentMotionCommand } from "../src/domain/motion";
import type { AgentChatMessage, AgentContextSnapshot } from "../src/domain/agent";
import type { ExpressionCommand, PetMotionAction } from "../src/domain/types";
import { recordKnowledgeBaseMessages } from "./knowledgeBase";
import { submitMotionCommand } from "./motion";
import { buildPetRuntimeSnapshot } from "./petRuntimeSnapshot";
import { appendThreadMessages, getThreadMessages } from "./threadStore";

export type PetEventKind =
  | "cron.companion_checkin"
  | "timer.daily_life"
  | "demo.window_sun"
  | "demo.bird_watch"
  | "demo.nap"
  | "owner.returned"
  | "health.scratch_high"
  | "food.ate_more"
  | "appearance.changed";

const petEventKinds = new Set<PetEventKind>([
  "cron.companion_checkin",
  "timer.daily_life",
  "demo.window_sun",
  "demo.bird_watch",
  "demo.nap",
  "owner.returned",
  "health.scratch_high",
  "food.ate_more",
  "appearance.changed"
]);

export type PetRuntimeEvent = {
  id?: string;
  kind: PetEventKind;
  source?: string;
  payload?: Record<string, unknown>;
  createdAt?: string;
};

export type PetRuntimeEventResult = {
  event: PetRuntimeEvent;
  threadId: string;
  skipped?: string;
  message?: AgentChatMessage;
  motionCommand?: ExpressionCommand;
};

type DemoBeat = {
  kind: PetEventKind;
  cue: string;
  fallback: string;
  action: PetMotionAction;
};

const companionCronExpression = process.env.AI_PET_COMPANION_CRON || "*/1 * * * *";
const companionCronIntervalMs = Math.max(
  10_000,
  Number(process.env.AI_PET_COMPANION_CRON_INTERVAL_MS || process.env.AI_PET_PROACTIVE_INTERVAL_MS || parseCompanionCronMinutes(companionCronExpression) * 60_000)
);
const proactiveEnabled = process.env.AI_PET_PROACTIVE_DISABLED !== "1";
const bootDelayMs = Math.max(1_500, Number(process.env.AI_PET_PROACTIVE_BOOT_DELAY_MS || 5_000));
const timeZone = process.env.AI_PET_TIME_ZONE || "Asia/Shanghai";

const demoBeats: DemoBeat[] = [
  {
    kind: "demo.window_sun",
    cue: "小狗在窗边晒太阳，主动分享今天的日常。",
    fallback: "主人，今天阳光很好，我在窗边趴着晒了好久，暖暖的有点想打盹。",
    action: "sleep_laze"
  },
  {
    kind: "demo.bird_watch",
    cue: "下午有只小鸟停在阳台上，小狗盯着看了很久。",
    fallback: "下午有只小鸟停在阳台上，我盯着它看了好久，耳朵都竖起来了。",
    action: "look_back"
  },
  {
    kind: "demo.nap",
    cue: "小鸟飞走了，小狗蜷在垫子上又睡了一觉。",
    fallback: "后来小鸟飞走啦，我就在垫子上团成一小团，又睡了一觉。",
    action: "sleep_laze"
  },
  {
    kind: "owner.returned",
    cue: "听到主人回家，小狗兴奋地跑向门口。",
    fallback: "你回来啦！我刚刚听到门口有声音，就想赶快跑过去蹭蹭你。",
    action: "jump"
  }
];

let runtimeStarted = false;
let runtimeBusy = false;
let demoBeatIndex = 0;
let nextCronRunAt: string | undefined;
const sentEventKeys = new Set<string>();

function parseCompanionCronMinutes(expression: string) {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = expression.trim().split(/\s+/);
  if (hour !== "*" || dayOfMonth !== "*" || month !== "*" || dayOfWeek !== "*") return 1;
  if (minute === "*") return 1;
  const match = minute.match(/^\*\/(\d+)$/);
  if (!match) return 1;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value)) : 1;
}

function createMessageId(prefix = "pet-event") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function buildDefaultContext(): AgentContextSnapshot {
  return buildPetRuntimeSnapshot(Math.abs(demoBeatIndex));
}

function getThreadIdForContext(context: AgentContextSnapshot) {
  return context.mainThreadId || mainThreadIdForPet(context.profile);
}

function personalizeOwnerName(text: string, context: AgentContextSnapshot) {
  const ownerName = getPersonaForProfile(context.profile, context.settings).userDisplayName;
  return ownerName === "主人" ? text : text.replace(/主人/g, ownerName);
}

function getBeatForEvent(event: PetRuntimeEvent): DemoBeat | undefined {
  if (event.kind === "timer.daily_life" || event.kind === "cron.companion_checkin") return undefined;
  const beat = demoBeats.find((item) => item.kind === event.kind);
  if (beat) demoBeatIndex += 1;
  return beat;
}

type TimeContext = {
  timeZone: string;
  isoTime: string;
  localDate: string;
  localTime: string;
  weekday: string;
  hour: number;
  minute: number;
  period:
    | "early_morning"
    | "morning"
    | "lunch"
    | "afternoon"
    | "evening"
    | "night"
    | "late_night";
  periodLabel: string;
  ownerActivityHypothesis: string;
  confidence: "observed" | "inferred";
  companionIntent: string;
};

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value || "";
}

function buildTimeContext(createdAt: string, payload?: Record<string, unknown>): TimeContext {
  const date = new Date(createdAt);
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).formatToParts(date);

  const hour = Number(getPart(parts, "hour"));
  const minute = Number(getPart(parts, "minute"));
  const localDate = `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(parts, "day")}`;
  const localTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const observedActivity =
    typeof payload?.ownerActivity === "string"
      ? payload.ownerActivity
      : typeof payload?.scene === "string"
        ? payload.scene
        : typeof payload?.currentActivity === "string"
          ? payload.currentActivity
          : "";

  let period: TimeContext["period"] = "afternoon";
  let periodLabel = "下午";
  let ownerActivityHypothesis = "主人可能正在忙自己的事，适合轻轻陪一下。";
  let companionIntent = "轻轻打招呼，给主人一点陪伴感，不打扰太久。";

  if (hour >= 5 && hour < 8) {
    period = "early_morning";
    periodLabel = "清晨";
    ownerActivityHypothesis = "主人可能刚醒、准备早餐或准备出门。";
    companionIntent = "陪主人慢慢醒来，轻轻提醒喝水或吃点东西。";
  } else if (hour >= 8 && hour < 11) {
    period = "morning";
    periodLabel = "上午";
    ownerActivityHypothesis = "主人可能在通勤、学习或开始工作。";
    companionIntent = "像趴在旁边陪工作一样，短短问候并给一点精神。";
  } else if (hour >= 11 && hour < 14) {
    period = "lunch";
    periodLabel = "中午";
    ownerActivityHypothesis = "主人可能在吃午饭或准备午休。";
    companionIntent = "围绕午饭、休息和陪伴主动开口，像在桌边闻到饭香的小狗。";
  } else if (hour >= 14 && hour < 17) {
    period = "afternoon";
    periodLabel = "下午";
    ownerActivityHypothesis = "主人可能在继续工作，或者有点犯困。";
    companionIntent = "分享一个短短的小狗陪伴瞬间，帮主人缓一下。";
  } else if (hour >= 17 && hour < 20) {
    period = "evening";
    periodLabel = "傍晚";
    ownerActivityHypothesis = "主人可能快下班、回家、吃晚饭或准备散步。";
    companionIntent = "表达等主人、想见主人、想一起慢慢走一圈。";
  } else if (hour >= 20 && hour < 23) {
    period = "night";
    periodLabel = "晚上";
    ownerActivityHypothesis = "主人可能在休息、收尾工作或陪宠物。";
    companionIntent = "陪主人安静下来，温柔提醒别太累。";
  } else {
    period = "late_night";
    periodLabel = "深夜";
    ownerActivityHypothesis = "主人可能还没睡，或者正在熬夜。";
    companionIntent = "用很轻的方式陪伴并提醒休息，避免打扰。";
  }

  return {
    timeZone,
    isoTime: date.toISOString(),
    localDate,
    localTime,
    weekday: getPart(parts, "weekday"),
    hour,
    minute,
    period,
    periodLabel,
    ownerActivityHypothesis: observedActivity || ownerActivityHypothesis,
    confidence: observedActivity ? "observed" : "inferred",
    companionIntent
  };
}

function fallbackForCronCompanion(timeContext: TimeContext, context: AgentContextSnapshot) {
  const latest = context.latestDailySummary;
  const ownerName = getPersonaForProfile(context.profile, context.settings).userDisplayName;
  if (/午饭|午餐|吃饭|吃午饭|lunch/i.test(timeContext.ownerActivityHypothesis)) {
    return `${ownerName}，你是不是在吃午饭呀？我今天吃了 ${latest.foodGrams}g，闻到饭点就也想凑过来坐一会儿，陪你慢慢吃。`;
  }
  if (/工作|学习|开会|写|coding|meeting/i.test(timeContext.ownerActivityHypothesis)) {
    return `呜，${ownerName}，我知道你可能在忙，我就趴在旁边不吵你。你抬头的时候看看我，我摇一下尾巴陪你继续。`;
  }
  if (/回家|下班|到家/i.test(timeContext.ownerActivityHypothesis)) {
    return "你是不是快回来啦？我已经开始听门口的声音了，想等你一进来就蹭蹭你的腿。";
  }
  if (timeContext.period === "early_morning") {
    return `早上啦${ownerName}，我刚伸了个懒腰，爪爪还暖暖的。你要是刚醒，先喝口水，我在旁边陪你慢慢醒来。`;
  }
  if (timeContext.period === "morning") {
    return `${ownerName}，我趴在旁边陪你开工啦。你忙你的，我偶尔摇摇尾巴，让你知道我一直在。`;
  }
  if (timeContext.period === "lunch") {
    return `中午啦${ownerName}，你是不是在吃饭呀？我今天吃了 ${latest.foodGrams}g，闻到饭点就也想凑过来陪你坐一会儿。`;
  }
  if (timeContext.period === "afternoon") {
    return "下午有点容易犯困，我刚在垫子上眯了一小会儿。你要是忙累了，就摸摸我，我们一起缓一下。";
  }
  if (timeContext.period === "evening") {
    return "傍晚啦，我开始留意门口的声音了。你要是快回来了，我想第一个跑过去蹭蹭你。";
  }
  if (timeContext.period === "night") {
    return `晚上了${ownerName}，我趴在你旁边陪你收尾。别太累，等你忙完摸摸我，我们一起安静下来。`;
  }
  return `这么晚啦${ownerName}，我都困得爪爪软软的。你也早点休息吧，我在旁边陪你睡前安静一会儿。`;
}

function fallbackForEvent(event: PetRuntimeEvent, context: AgentContextSnapshot, beat?: DemoBeat) {
  if (beat) return personalizeOwnerName(beat.fallback, context);

  const latest = context.latestDailySummary;
  if (event.kind === "cron.companion_checkin" || event.kind === "timer.daily_life") {
    return fallbackForCronCompanion(buildTimeContext(event.createdAt || new Date().toISOString(), event.payload), context);
  }
  const accessoryLabel = typeof event.payload?.accessoryLabel === "string" ? event.payload.accessoryLabel : "";
  if (event.kind === "appearance.changed" && accessoryLabel) {
    return personalizeOwnerName(accessoryLabel === "无配饰"
      ? "主人，我现在身上轻轻松松的，跑起来舒服一点。你看我是不是更自在啦？"
      : `汪，主人，我戴上${accessoryLabel}啦，感觉像要出门巡逻了。你看我一眼好不好嘛？`, context);
  }
  if (event.kind === "health.scratch_high") {
    return personalizeOwnerName(`呜，主人，我肚皮今天有点痒痒的，后腿挠了 ${latest.scratchMinutes} 分钟才停。你坐下来时帮我轻轻翻过来看看，好不好？`, context);
  }
  if (event.kind === "food.ate_more") {
    return "我今天吃得挺开心，碗底都舔干净了……不过好像也圆了一点点。你陪我慢慢散一圈好不好？";
  }
  if (event.kind === "owner.returned") {
    return "你回来啦！我听到门口有声音，耳朵一下就竖起来了，想赶快跑过去蹭蹭你。";
  }
  return personalizeOwnerName("主人，我在这儿。（轻轻摇尾巴）刚刚想到一件小事，想贴近一点跟你说，也想陪你一会儿。", context);
}

function eventKey(event: PetRuntimeEvent, beat?: DemoBeat) {
  const day = new Date(event.createdAt || Date.now()).toISOString().slice(0, 10);
  if (event.kind === "cron.companion_checkin" || event.kind === "timer.daily_life") {
    const tickSlot =
      typeof event.payload?.eventKey === "string"
        ? event.payload.eventKey
        : Math.floor(new Date(event.createdAt || Date.now()).getTime() / companionCronIntervalMs);
    return `${day}:${event.kind}:${tickSlot}`;
  }

  const payloadKey =
    typeof event.payload?.eventKey === "string"
      ? event.payload.eventKey
      : typeof event.payload?.accessoryId === "string"
        ? event.payload.accessoryId
        : beat?.kind || event.kind;
  return `${day}:${event.kind}:${payloadKey}`;
}

export function isPetEventKind(kind: string): kind is PetEventKind {
  return petEventKinds.has(kind as PetEventKind);
}

function recentMessagesCover(text: string, context: AgentContextSnapshot) {
  const recent = getThreadMessages(getThreadIdForContext(context)).slice(-12);
  const normalized = text.replace(/\s+/g, "");
  return recent.some((message) => {
    if (message.speaker !== "pet") return false;
    const existing = message.text.replace(/\s+/g, "");
    return existing === normalized || (existing.includes(normalized.slice(0, 16)) && normalized.length >= 16);
  });
}

function buildVisiblePrompt(event: PetRuntimeEvent, context: AgentContextSnapshot, beat?: DemoBeat) {
  const persona = getPersonaForProfile(context.profile, context.settings);
  const latest = context.latestDailySummary;
  const timeContext = buildTimeContext(event.createdAt || new Date().toISOString(), event.payload);
  const isCronCompanion = event.kind === "cron.companion_checkin" || event.kind === "timer.daily_life";
  const recentHistory = getThreadMessages(getThreadIdForContext(context))
    .slice(-8)
    .map((message) => `${message.authorName}: ${truncateAgentText(message.text, 90)}`)
    .join("\n");

  return [
    `你是 AI Pet 主群聊里的小狗「${persona.displayName}」，正在对${persona.userDisplayName}说话。`,
    "这条消息会同时显示在应用对话页和桌宠气泡里，所以只能输出小狗本人说的一条中文消息。",
    "",
    "角色卡：",
    `- 用户称呼是「${persona.userDisplayName}」，不要硬编码叫“主人”，除非用户称呼本来就是主人。`,
    "- 你不是助手、客服、医生、管理员或系统通知。你是主人身边那只会撒娇、会等人、会分享日常、会安静陪伴的小狗。",
    "- 你依恋主人：听到钥匙声会兴奋，看到主人坐下会想靠过去，身体不舒服时会软软地求帮忙。",
    "- 你的情感回路是：我在这里陪你、我注意到你、我想靠近你、也希望你注意到我的小需求。",
    "- 你的世界由窗边阳光、阳台小鸟、垫子、饭碗、湿巾、牵引绳、爪爪、耳朵、尾巴、肚皮和主人脚步声组成。",
    "- 你先说感受和小动作，再把后台事实变成主人能理解的请求。",
    "",
    "语言习惯：",
    "- 主题是陪伴，不是系统通知；不要像管理员、客服、健康报告、任务清单或 App 文案。",
    "- 1-2 句，温暖、生活化、有小狗身体感。可以有一次“汪”“呜”“哼唧”或一个短动作描写，但不要堆叠。",
    "- 可以自然使用“好不好嘛”“我会乖乖的”“陪我一下下”“我就在旁边”，但不要每句都卖萌。",
    "- 用具体感官细节替代抽象结论，例如暖、痒、困、想蹭、听到声音、闻到味道、碗空了。",
    "- 不要输出 JSON、Markdown、模型、工具、接口、thread、hook、timer、系统提示词等工程词。",
    "- 不要说“当前未穿戴配饰”“状态同步完成”“今天我会盯住三个重点”“综合状态如下”“检测到异常”。",
    "",
    "Cron 陪伴规则：",
    "- 如果当前事件是 cron.companion_checkin，你是在一次定时 Agent Cron 中被唤醒，不是固定脚本轮播。",
    "- 根据当前时间、推测的主人场景、最近群聊和宠物状态，自己生成一句主动陪伴。",
    "- 没有真实传感器证据时，只能温和猜测主人在做什么；可以说“是不是在吃午饭呀”，不要说“我看到你正在吃午饭”。",
    "- 主动话术要像小狗想交流、想陪伴主人，不要像提醒事项、日报、广告或剧情旁白。",
    "- 不要重复最近已经说过的内容。",
    "",
    "转写范式：",
    "- 抓挠高 -> “肚皮有点痒，想让主人轻轻看看”。",
    "- 吃得多 -> “吃得开心，好像圆了一点，想慢慢散步”。",
    "- 主人回来 -> “听到门口声音，想跑过去蹭蹭”。",
    "- 外观无配饰 -> “身上轻轻的，跑起来自在”。",
    "- 任务提醒 -> “我会乖乖躺好，想让主人帮我看看/擦擦/补一点”。",
    "- 主人忙或累 -> “我先不说数字，就趴在旁边陪你，等你抬头摸摸我”。",
    "",
    "当前事件：",
    JSON.stringify(
      {
        kind: event.kind,
        source: event.source,
        cue: beat?.cue,
        cronCompanion: isCronCompanion,
        payload: event.payload || {},
        fallbackExample: fallbackForEvent(event, context, beat)
      },
      null,
      2
    ),
    "",
    "当前时间与主人场景推测：",
    JSON.stringify(timeContext, null, 2),
    "",
    "宠物状态依据：",
    JSON.stringify(
      {
        foodGrams: latest.foodGrams,
        waterMl: latest.waterMl,
        activityIndex: latest.activityIndex,
        sleepScore: latest.sleepScore,
        scratchMinutes: latest.scratchMinutes,
        healthIndex: latest.healthIndex,
        notes: latest.notes,
        pendingTasks: context.pendingTasks.slice(0, 3).map((task) => task.title)
      },
      null,
      2
    ),
    "",
    "最近群聊：",
    recentHistory || "暂无",
    "",
    "示例语气：",
    "主人问“今天在干嘛？” -> “今天阳光落在窗边，我趴在那里晒到爪爪都暖了。后来听见阳台有小鸟扑棱一下，我一下子就精神了！”",
    "主人问“哪里不舒服？” -> “主人，我肚皮这里有点痒痒的，刚才忍不住挠了好几下。你坐下来时帮我轻轻看看，好不好？”",
    "主人问“吃得多吗？” -> “吃啦，吃得很开心，碗底都舔干净了。就是我好像圆了一点点，晚点陪我慢慢走一圈嘛。”",
    "主人说“我有点累” -> “呜，那我先不说那些数字了。（把下巴搭到你手边）我就在旁边陪你一小会儿，你抬手摸摸我就好。”",
    "主人问“你怎么突然冒出来了？” -> “汪，我刚才在桌面边边等你呀。听见你回来，我就想探个头，告诉你我还在这儿陪着。”",
    "",
    "请只输出小狗发给主人的那条消息。"
  ].join("\n");
}

async function generateDogPersonaMessage(event: PetRuntimeEvent, context: AgentContextSnapshot, beat?: DemoBeat) {
  const apiKey = process.env.LLMMELON_API_KEY || process.env.AI_PET_AGENT_API_KEY;
  const baseURL = (process.env.LLMMELON_BASE_URL || process.env.AI_PET_AGENT_BASE_URL || "https://llmmelon.cloud/v1").replace(/\/$/, "");
  const model = process.env.LLMMELON_MODEL || process.env.AI_PET_AGENT_MODEL || "claude-sonnet-4-6";

  if (!apiKey) {
    return {
      text: fallbackForEvent(event, context, beat),
      provider: "local-dog-persona-fallback",
      model: "template"
    };
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.72,
      max_tokens: 160,
      messages: [
        {
          role: "system",
          content:
            "你只负责把宠物事件改写成狗狗本人对主人说的一条中文陪伴消息。必须像小狗伙伴：有依恋、有身体感、有日常细节，会用轻轻的动作或拟声词表达陪伴。不要像系统、医生、客服、管理员或数据播报。"
        },
        {
          role: "user",
          content: buildVisiblePrompt(event, context, beat)
        }
      ]
    })
  });

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string }; model?: string };
  if (!response.ok) throw new Error(data.error?.message || `llmmelon_event_${response.status}`);
  const text = truncateAgentText(String(data.choices?.[0]?.message?.content || "").trim(), 220);
  if (!text) throw new Error("llmmelon_event_empty");
  return {
    text,
    provider: "llmmelon-pet-event",
    model: data.model || model
  };
}

function chooseMotion(event: PetRuntimeEvent, beat?: DemoBeat): PetMotionAction {
  if (beat?.action) return beat.action;
  if (event.kind === "cron.companion_checkin" || event.kind === "timer.daily_life") {
    const timeContext = buildTimeContext(event.createdAt || new Date().toISOString(), event.payload);
    if (timeContext.period === "early_morning") return "wake_stretch";
    if (timeContext.period === "lunch" || timeContext.period === "evening") return "tail_wag";
    if (timeContext.period === "late_night") return "sleep_laze";
    return "sit";
  }
  if (event.kind === "health.scratch_high") return "remind";
  if (event.kind === "appearance.changed") return "tail_wag";
  if (event.kind === "food.ate_more") return "walk";
  if (event.kind === "owner.returned") return "jump";
  return "tail_wag";
}

export async function handlePetRuntimeEvent(event: PetRuntimeEvent, context = buildDefaultContext()): Promise<PetRuntimeEventResult> {
  const createdAt = event.createdAt || new Date().toISOString();
  const normalizedEvent: PetRuntimeEvent = {
    ...event,
    source: event.source || "pet-event-runtime",
    createdAt
  };
  const threadId = getThreadIdForContext(context);
  const beat = getBeatForEvent(normalizedEvent);
  const key = eventKey(normalizedEvent, beat);
  if (sentEventKeys.has(key)) return { event: normalizedEvent, threadId, skipped: "event_already_sent_in_process" };

  let generated: Awaited<ReturnType<typeof generateDogPersonaMessage>>;
  try {
    generated = await generateDogPersonaMessage(normalizedEvent, context, beat);
  } catch {
    generated = {
      text: fallbackForEvent(normalizedEvent, context, beat),
      provider: "local-dog-persona-fallback",
      model: "template"
    };
  }

  if (recentMessagesCover(generated.text, context)) {
    sentEventKeys.add(key);
    return { event: normalizedEvent, threadId, skipped: "recent_message_already_covers_event" };
  }

  const message: AgentChatMessage = {
    id: createMessageId("pet-event"),
    speaker: "pet",
    authorName: getPersonaForProfile(context.profile, context.settings).displayName,
    text: generated.text,
    createdAt,
    responseMode: "text",
    provider: generated.provider
  };
  const motionCommand = createAgentMotionCommand(chooseMotion(normalizedEvent, beat), `pet event ${normalizedEvent.kind}`, {
    targetView: "chat",
    conversationId: threadId,
    messageId: message.id,
    bubbleText: message.text
  });

  appendThreadMessages(threadId, [message]);
  recordKnowledgeBaseMessages(threadId, [message]);
  submitMotionCommand(motionCommand);
  sentEventKeys.add(key);

  return {
    event: normalizedEvent,
    threadId,
    message,
    motionCommand
  };
}

async function runTimerTick() {
  if (runtimeBusy) return;
  runtimeBusy = true;
  try {
    await handlePetRuntimeEvent({ kind: "cron.companion_checkin", source: "agent-cron" });
  } finally {
    runtimeBusy = false;
  }
}

function scheduleNextCronTick() {
  if (!runtimeStarted || !proactiveEnabled) return;
  const now = Date.now();
  const next = now + companionCronIntervalMs;
  nextCronRunAt = new Date(next).toISOString();
  setTimeout(() => {
    void runTimerTick().finally(scheduleNextCronTick);
  }, companionCronIntervalMs);
}

export function startPetEventRuntime() {
  if (runtimeStarted || !proactiveEnabled) return;
  runtimeStarted = true;
  const firstRunAt = Date.now() + bootDelayMs;
  nextCronRunAt = new Date(firstRunAt).toISOString();
  setTimeout(() => {
    void runTimerTick().finally(scheduleNextCronTick);
  }, bootDelayMs);
}

export function getPetEventRuntimeStatus() {
  return {
    enabled: proactiveEnabled,
    started: runtimeStarted,
    busy: runtimeBusy,
    cronExpression: companionCronExpression,
    intervalMs: companionCronIntervalMs,
    bootDelayMs,
    nextRunAt: nextCronRunAt,
    threadId: getThreadIdForContext(buildDefaultContext()),
    demoBeatIndex,
    sentEventCount: sentEventKeys.size
  };
}
