import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  HeartPulse,
  Heart,
  Keyboard,
  Layers,
  Lightbulb,
  MapPin,
  MessageCircle,
  Mic2,
  Minus,
  Moon,
  MoreVertical,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Utensils,
  UserRound,
  Volume2,
  UsersRound,
  X
} from "lucide-react";
import { apiUrl } from "../api";
import { createInitialAgentMessages, createLocalAgentTurn, getPersonaForProfile, mainThreadIdForPet } from "../domain/agent";
import { average, computeVirtualState, currentPacket, latestDaily, planDailyTasks, recommendProducts } from "../domain/engine";
import { dailySummaries, inventory, manualObservations, petProfiles, productCatalog, streamPackets } from "../domain/mockData";
import { getPetDisplayIdentity } from "../domain/profile";
import { ChatWaitingCue } from "../components/ChatWaitingCue";
import { KnowledgeBaseView } from "../components/KnowledgeBaseView";
import { MochiMotionAvatar, type MochiMotionId } from "../components/MochiMotionAvatar";
import type { AgentChatMessage, AgentContextSnapshot, AgentResponseMode, AgentToolCard } from "../domain/agent";
import type { DailySummary, DailyTask, ExpressionCommand, InventoryItem, PetAccessoryId, PetMotionAction, PetProfile, StreamPacket, VirtualPetState } from "../domain/types";

type ViewId = "market" | "community" | "chat" | "status" | "my";
type AppViewId = "welcome" | ViewId;
type OutfitId = "none" | "trail" | "rain" | "party";
type MarketCategory = "all" | "food" | "care" | "toy" | "health";
type OutfitTab = "服装" | "毛发" | "妆容" | "配饰";
type OutfitOption = { id: OutfitId; label: string; meta: string; token: string; accent: string; image: string; thumbnailImage?: string };
type AppearanceOption = { id: string; label: string; meta: string; token: string; accent: string; image: string; thumbnailImage?: string };
type AccessoryOption = AppearanceOption & { id: PetAccessoryId };
type RewardSummary = {
  dailyPoints: number;
  availablePoints: number;
  completedTasks: number;
  totalTasks: number;
  streakDays: number;
  weeklyPoints: number;
  progressPct: number;
};
type LeaderboardEntry = {
  rank: number;
  petName: string;
  ownerLabel: string;
  points: number;
  completedTasks: number;
  streakDays: number;
  badge: string;
  self?: boolean;
};
type RewardUnlock = {
  id: string;
  title: string;
  rewardType: "outfit" | "accessory" | "badge" | "item";
  linkedCatalogId?: string;
  conditionLabel: string;
  progressValue: number;
  targetValue: number;
  unlocked: boolean;
  detail: string;
};
type MyPageMode = "home" | "incentive" | "tasks" | "leaderboard" | "rewards" | "knowledge";

const motionActionLabels: Record<PetMotionAction, string> = {
  idle: "待在原地",
  idle_happy: "开心待机",
  walk: "走两步",
  play: "玩一下",
  sleep: "睡觉",
  sleep_laze: "趴下偷懒",
  eat: "吃东西",
  scratch: "挠一挠",
  bark: "叫一声",
  tired_idle: "有点累",
  alert: "警觉提醒",
  jump: "跳一下",
  spin: "转个圈",
  turn: "转身",
  sit: "坐下",
  come_closer: "靠近一点",
  nod: "点点头",
  look_back: "回头看",
  tail_wag: "摇尾巴",
  remind: "提醒主人",
  wake_stretch: "伸懒腰",
  sniff_explore: "嗅闻探索"
};

function formatToolCardDetail(card: AgentToolCard) {
  if (card.kind === "motion" && card.detail in motionActionLabels) {
    return motionActionLabels[card.detail as PetMotionAction];
  }
  if (card.kind === "voice") return card.detail || "语音已准备";
  return card.detail;
}

function getVisibleToolCards(message: AgentChatMessage) {
  return (message.toolCards || []).filter((card) => card.kind !== "motion");
}

const proactiveIssueTokens = ["肚皮", "红点", "皮肤", "饭没有吃够", "进食", "健康指数", "状态有点低"];
const AGENT_REPLY_TIMEOUT_MS = 18_000;

function sharesProactiveIssue(left: string, right: string) {
  return proactiveIssueTokens.some((token) => left.includes(token) && right.includes(token));
}

function normalizeMessagesForDisplay(messages: AgentChatMessage[]) {
  return messages.filter((message, index) => {
    if (message.provider !== "proactive-alert") return true;
    const recentPetMessages = messages.slice(Math.max(0, index - 6), index).filter((item) => item.speaker === "pet");
    return !recentPetMessages.some((item) => item.provider === "proactive-alert" || sharesProactiveIssue(item.text, message.text));
  });
}

function mergeMessages(base: AgentChatMessage[], incoming: AgentChatMessage[]) {
  const seen = new Set<string>();
  const merged = [...base, ...incoming].filter((message) => {
    if (!message.id || seen.has(message.id)) return false;
    seen.add(message.id);
    return true;
  });
  const serverPetTurns = new Set(
    merged
      .filter((message) => message.speaker === "pet" && message.clientTurnId && message.provider !== "client-local-agent-fallback")
      .map((message) => message.clientTurnId as string)
  );
  const seenPetTurns = new Set<string>();
  return normalizeMessagesForDisplay(
    merged.filter((message) => {
      if (message.speaker !== "pet" || !message.clientTurnId) return true;
      if (message.provider === "client-local-agent-fallback" && serverPetTurns.has(message.clientTurnId)) return false;
      if (message.provider !== "client-local-agent-fallback") {
        if (seenPetTurns.has(message.clientTurnId)) return false;
        seenPetTurns.add(message.clientTurnId);
      }
      return true;
    })
  );
}

function createClientId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  return `${prefix}-${randomId}`;
}

declare global {
  interface Window {
    aiPetAppWindow?: {
      close: () => void;
      onNavigate?: (callback: (targetView: string) => void) => () => void;
    };
  }
}

function resolveAppView(value: string | null | undefined, fallback: AppViewId = "welcome"): AppViewId {
  if (value === "market" || value === "community" || value === "chat" || value === "status" || value === "my" || value === "welcome") return value;
  if (value === "outfit") return "my";
  if (value === "tasks" || value === "care") return "status";
  return fallback;
}

function readInitialAppView(): AppViewId {
  if (typeof window === "undefined") return "welcome";
  return resolveAppView(new URLSearchParams(window.location.search).get("view"), "welcome");
}

const navItems: Array<{ id: ViewId; label: string; icon: ElementType }> = [
  { id: "market", label: "市集", icon: ShoppingBag },
  { id: "community", label: "社区", icon: UsersRound },
  { id: "chat", label: "对话", icon: MessageCircle },
  { id: "status", label: "状态", icon: HeartPulse },
  { id: "my", label: "我的", icon: UserRound }
];

const marketCategories: Array<{ id: MarketCategory; label: string }> = [
  { id: "all", label: "全部" },
  { id: "food", label: "主粮" },
  { id: "care", label: "护理" },
  { id: "toy", label: "玩具" },
  { id: "health", label: "保健" }
];

const marketProducts: Array<{
  id: string;
  category: Exclude<MarketCategory, "all">;
  title: string;
  price: number;
  tag: string;
  reason: string;
  detail: string;
  art: string;
  image: string;
  imageAlt: string;
  sourceName: string;
  sourceUrl: string;
}> = [
  {
    id: "food_salmon",
    category: "food",
    title: "Purina Pro Plan 三文鱼低敏主粮",
    price: 189,
    tag: "低敏主粮",
    reason: "当前库存低于 2 天，且配方避开鸡肉过敏源。",
    detail: "今天为什么推荐：现有三文鱼主粮只剩约 1.8 天，旺财有鸡肉过敏和敏感肠胃，先补同蛋白低敏配方，避免临时换粮。换粮仍需 7 天过渡。",
    art: "food",
    image: "assets/market/pro-plan-salmon.png",
    imageAlt: "Purina Pro Plan Sensitive Skin and Stomach Salmon and Rice dog food bag",
    sourceName: "Purina",
    sourceUrl: "https://www.purina.com/dogs/shop/pro-plan-specialized-nutrition-sensitive-skin-stomach-salmon-rice-dry-dog-food"
  },
  {
    id: "care_wipes",
    category: "care",
    title: "Earth Rated 无香宠物清洁湿巾",
    price: 39,
    tag: "腹部护理",
    reason: "抓挠上升，今晚需要复查腹部红点。",
    detail: "今天为什么推荐：早间抓挠升高，手动记录了腹部左侧红点。无香湿巾适合散步后做爪子和腹部局部清洁；破皮、渗液或明显疼痛时不要反复擦拭。",
    art: "care",
    image: "assets/market/earth-rated-wipes.png",
    imageAlt: "Earth Rated unscented dog wipes package",
    sourceName: "Decker's Dog + Cat",
    sourceUrl: "https://www.deckerspets.com/products/earth-rated-unscented-wipes-100-ct"
  },
  {
    id: "toy_snuffle",
    category: "toy",
    title: "IKEA UTSÅDD 可水洗嗅闻垫",
    price: 68,
    tag: "低强度玩耍",
    reason: "睡眠分偏低，建议用嗅闻替代高强度追逐。",
    detail: "今天为什么推荐：睡眠分偏低，今晚不适合追球到过度兴奋。嗅闻垫能把活动强度降下来，同时保留陪伴互动和奖励训练。",
    art: "toy",
    image: "assets/market/ikea-utsadd-snuffle.jpg",
    imageAlt: "IKEA UTSÅDD blue dog snuffle mat",
    sourceName: "IKEA",
    sourceUrl: "https://www.ikea.com/us/en/p/utsadd-snuffle-mat-for-dog-blue-60572119/"
  },
  {
    id: "health_skin",
    category: "health",
    title: "Zesty Paws Allergy & Immune Bites",
    price: 96,
    tag: "皮肤关注",
    reason: "抓挠比 7 日基线上升，作为后续观察入口。",
    detail: "今天为什么推荐：抓挠趋势正在观察期，这类皮肤关注补充品只能作为后续护理参考，不替代兽医诊断；红肿扩大、渗液或持续恶化应先就医。",
    art: "health",
    image: "assets/market/zesty-paws-allergy.jpg",
    imageAlt: "Zesty Paws Allergy and Immune Bites jar",
    sourceName: "Target",
    sourceUrl: "https://www.target.com/p/zesty-paws-allergy-immune-supplement-bites-for-dogs-peanut-butter-90ct-all-ages-immune-system-health/-/A-87389329"
  },
  {
    id: "food_treat",
    category: "food",
    title: "PureBites 冻干三文鱼训练零食",
    price: 49,
    tag: "奖励零食",
    reason: "用于完成腹部复查后的正向奖励。",
    detail: "今天为什么推荐：腹部复查后需要一个低负担奖励，单一三文鱼原料能避开鸡肉过敏源；今天零食热量仍要控制在 70 kcal 内。",
    art: "food-alt",
    image: "assets/market/purebites-salmon.png",
    imageAlt: "PureBites freeze dried salmon dog treats package",
    sourceName: "PureBites",
    sourceUrl: "https://purebites.com/products/salmon-freeze-dried-dog-treats"
  },
  {
    id: "care_raincoat",
    category: "care",
    title: "Ruffwear Sun Shower 防雨披风",
    price: 128,
    tag: "外出护理",
    reason: "低强度散步后减少腹部沾湿。",
    detail: "今天为什么推荐：晚间低强度散步后要减少腹部沾湿和反复舔咬。防雨披风只解决外出打湿问题，回家仍要复查腹部红点。",
    art: "care-alt",
    image: "assets/market/ruffwear-sun-shower.png",
    imageAlt: "Ruffwear Sun Shower dog raincoat product image",
    sourceName: "Ruffwear",
    sourceUrl: "https://ruffwear.com/products/sun-shower-dog-raincoat"
  }
];

const outfitOptions: OutfitOption[] = [
  { id: "none", label: "不穿服装", meta: "脱下当前", token: "NO OUTFIT", accent: "#d8d2ca", image: "assets/outfit/none.jpg" },
  { id: "trail", label: "巡逻背心", meta: "低强度散步", token: "SAFE WALK", accent: "#ff8f73", image: "assets/outfit/trail-vest.jpg" },
  { id: "rain", label: "雨天披风", meta: "腹部保暖", token: "RAIN READY", accent: "#7ec8e3", image: "assets/outfit/rain-coat.jpg" },
  { id: "party", label: "生日丝巾", meta: "陪伴奖励", token: "MOOD +8", accent: "#e2a640", image: "assets/outfit/birthday-bandana.jpg" }
];

const outfitTabs: OutfitTab[] = ["服装", "毛发", "妆容", "配饰"];

const passiveAppearanceCatalog: Record<Exclude<OutfitTab, "服装" | "配饰">, AppearanceOption[]> = {
  毛发: [
    { id: "fur-none", label: "不调整毛发", meta: "保持原样", token: "NO FUR CHANGE", accent: "#d8d2ca", image: "assets/outfit/none.jpg" },
    { id: "fur-soft", label: "蜂蜜柔光", meta: "更暖的毛色", token: "COAT WARM", accent: "#d79554", image: "assets/outfit/fur-soft.jpg" },
    { id: "fur-cream", label: "奶油腹毛", meta: "强化白胸口", token: "CREAM COAT", accent: "#f6ddbb", image: "assets/outfit/fur-cream.jpg" },
    { id: "fur-clean", label: "清爽修毛", meta: "适合护理日", token: "GROOMED", accent: "#a8d8b9", image: "assets/outfit/fur-clean.jpg" }
  ],
  妆容: [
    { id: "makeup-none", label: "不做妆容", meta: "保持原样", token: "NO MAKEUP", accent: "#d8d2ca", image: "assets/outfit/none.jpg" },
    { id: "makeup-bright", label: "元气腮红", meta: "心情 +5", token: "MOOD LOOK", accent: "#f4a9a8", image: "assets/outfit/makeup-bright.jpg" },
    { id: "makeup-star", label: "星星贴", meta: "社区照片", token: "PHOTO READY", accent: "#e2a640", image: "assets/outfit/makeup-star.jpg" },
    { id: "makeup-calm", label: "安静眼神", meta: "夜间陪伴", token: "CALM FACE", accent: "#7ec8e3", image: "assets/outfit/makeup-calm.jpg" }
  ]
};

const accessoryOptions: AccessoryOption[] = [
  { id: "none", label: "无配饰", meta: "脱下当前", token: "NO ACCESSORY", accent: "#d8d2ca", image: "assets/outfit/none.jpg", thumbnailImage: "assets/outfit/acc-none-item.png" },
  { id: "acc-gps", label: "定位徽章", meta: "状态同步", token: "GPS ON", accent: "#7ec8e3", image: "assets/outfit/acc-gps.jpg", thumbnailImage: "assets/outfit/acc-gps-item.png" },
  { id: "acc-bell", label: "提醒铃铛", meta: "任务提醒", token: "BELL ON", accent: "#ff8f73", image: "assets/outfit/acc-bell.jpg", thumbnailImage: "assets/outfit/acc-bell-item.png" },
  { id: "acc-medal", label: "巡逻奖章", meta: "完成奖励", token: "MEDAL", accent: "#e2a640", image: "assets/outfit/acc-medal.jpg", thumbnailImage: "assets/outfit/acc-medal-item.png" }
];

const accessoryIds = new Set<PetAccessoryId>(accessoryOptions.map((item) => item.id));

const outfitPreviewMotionSequence: MochiMotionId[] = [
  "idle",
  "walk",
  "jump",
  "tail_wag",
  "look_back",
  "turn",
  "sleep_laze",
  "remind",
  "alert",
  "sit",
  "wake_stretch",
  "sniff_explore"
];

const communityPosts = [
  {
    id: "post_1",
    title: "今天完成了低强度巡逻，回来主动喝水。",
    author: "@宠物伙伴",
    likes: 128,
    tone: "warm",
    detail: "今天没有安排高强度奔跑，只做了 35 分钟巡逻。回来后主动喝水，腹部红点准备晚上再拍照记录。",
    tags: ["低强度散步", "饮水"],
    image: "assets/community/dogs-drinking-water.jpg",
    imageAlt: "dogs drinking water from a bowl in a park",
    sourceName: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/dogs-drinking-water-from-a-bowl-in-a-park-16652409/"
  },
  {
    id: "post_2",
    title: "抓挠突然变多时，我会先看饮食、皮肤和最近环境变化。",
    author: "@宠物医生",
    likes: 312,
    tone: "blue",
    detail: "照护记录：先记录位置、持续时间、是否有红点和渗液，再看近 48 小时饮食、环境和洗护变化。",
    tags: ["健康报告", "抓挠"],
    image: "assets/community/puppy-scratching-ear.jpg",
    imageAlt: "puppy scratching its ear outdoors",
    sourceName: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/a-puppy-scratching-its-ear-6125775/"
  },
  {
    id: "post_3",
    title: "雨天披风试穿记录：腹部没有再被草地打湿。",
    author: "@装备控",
    likes: 89,
    tone: "green",
    detail: "披风长度刚好盖住腹部，回来后只需要擦脚。这个帖子用于展示装扮和护理之间的联动。",
    tags: ["装扮", "护理"],
    image: "assets/community/dog-raincoat.jpg",
    imageAlt: "dog and owner wearing yellow raincoats on a rainy walk",
    sourceName: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/a-person-and-dog-wearing-a-raincoat-8499439/"
  },
  {
    id: "post_4",
    title: "分享一个嗅闻垫替代高强度奔跑的小技巧。",
    author: "@陪伴训练员",
    likes: 256,
    tone: "pink",
    detail: "把 10 分钟嗅闻任务拆成三轮，每轮结束给一句语音鼓励，适合睡眠分偏低的晚上。",
    tags: ["玩具", "训练"],
    image: "assets/community/corgi-leash-grass.jpg",
    imageAlt: "corgi walking on grass on a leash",
    sourceName: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/dog-on-leash-on-grass-20814342/"
  },
  {
    id: "post_5",
    title: "耳朵和腹部一起复查：先拍照记录，再决定是否就医。",
    author: "@护理记录员",
    likes: 174,
    tone: "green",
    detail: "把抓挠位置、红点范围和耳道状态放在同一张复查清单里；如果出现渗液、疼痛或持续恶化，就不继续在家反复擦拭。",
    tags: ["复查", "皮肤护理"],
    image: "assets/community/dog-vet-checkup.jpg",
    imageAlt: "veterinary volunteers checking a dog's ear",
    sourceName: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/a-dog-having-a-checkup-on-a-veterinary-7470755/"
  },
  {
    id: "post_6",
    title: "完成腹部复查后，用一粒零食做安静奖励。",
    author: "@训练搭子",
    likes: 203,
    tone: "warm",
    detail: "复查结束后不要马上疯跑，先坐下、等待、吃一粒小奖励。这个流程能把护理动作变成可接受的日常仪式。",
    tags: ["奖励训练", "护理后"],
    image: "assets/community/dog-training-treat.jpg",
    imageAlt: "owner giving a dog a treat during outdoor training",
    sourceName: "Pexels",
    sourceUrl: "https://www.pexels.com/photo/owner-giving-a-dog-a-treat-27177031/"
  }
];

export function App() {
  const [view, setView] = useState<AppViewId>(() => readInitialAppView());
  const [outfit, setOutfit] = useState<OutfitId>("none");
  const [accessory, setAccessory] = useState<PetAccessoryId>("none");
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(() => new Set(["task_water"]));

  const profile = petProfiles[0];
  const profileIdentity = getPetDisplayIdentity(profile);
  const packet = currentPacket(streamPackets, 21);
  const latest = latestDaily(dailySummaries);
  const state = useMemo(() => computeVirtualState(profile, dailySummaries, packet, { play: 6, clean: 4 }), [packet, profile]);
  const tasks = useMemo(() => planDailyTasks(profile, dailySummaries, state, inventory, manualObservations), [profile, state]);
  const recommendations = useMemo(() => recommendProducts(profile, tasks, inventory, productCatalog), [profile, tasks]);
  const rewardSummary = useMemo(() => buildRewardSummary(tasks, completedTaskIds), [tasks, completedTaskIds]);
  const leaderboard = useMemo(() => buildCareLeaderboard(profileIdentity.displayName, rewardSummary), [profileIdentity.displayName, rewardSummary]);
  const baseline = useMemo(() => buildBaseline(dailySummaries), []);
  const selectedOutfit = outfitOptions.find((item) => item.id === outfit) || outfitOptions[0];
  const agentContext = useMemo<AgentContextSnapshot>(
    () => ({
      profile,
      state,
      latestDailySummary: latest,
      currentDevicePacket: packet,
      pendingTasks: tasks.filter((task) => task.status === "pending"),
      inventory,
      manualObservations,
      productRecommendations: recommendations.slice(0, 5),
      selectedOutfit: accessory
    }),
    [profile, state, latest, packet, tasks, recommendations, accessory]
  );

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/desktop-pet/appearance"), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : undefined))
      .then((appearance: { accessoryId?: PetAccessoryId } | undefined) => {
        if (!cancelled && appearance?.accessoryId && accessoryIds.has(appearance.accessoryId)) {
          setAccessory(appearance.accessoryId);
        }
      })
      .catch(() => {
        // The Electron app can still preview local state if the API process is not running.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function completeTask(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    setCompletedTaskIds((current) => {
      if (current.has(taskId)) return current;
      const next = new Set(current);
      next.add(taskId);
      return next;
    });

    if (task) {
      void fetch(apiUrl("/api/knowledge-base/events"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "task_completed",
          source: "daily-task",
          task
        })
      }).catch(() => {
        // The UI task state remains local if the demo API is not running.
      });
    }
  }

  useEffect(() => {
    const dispose = window.aiPetAppWindow?.onNavigate?.((targetView) => {
      setView(resolveAppView(targetView, "welcome"));
    });
    return () => {
      dispose?.();
    };
  }, []);

  return (
    <div className="demo-stage">
      <main className={`pet-window${view === "welcome" ? " pet-window-welcome" : ""}`} aria-label="AI Pet application window">
        <section className="screen-stack">
          {view === "welcome" ? <WelcomeView state={state} accessory={accessory} outfit={outfit} accent={selectedOutfit.accent} onStart={() => setView("chat")} /> : null}
          {view === "market" ? <MarketView petName={profileIdentity.displayName} latest={latest} baseline={baseline} inventoryItems={inventory} /> : null}
          {view === "community" ? <CommunityView petName={profileIdentity.displayName} /> : null}
          {view === "chat" ? <ChatHome profile={profile} state={state} accessory={accessory} outfit={outfit} accent={selectedOutfit.accent} context={agentContext} /> : null}
          {view === "status" ? (
            <StatusDataView
              profile={profile}
              state={state}
              latest={latest}
              baseline={baseline}
              packet={packet}
              accessory={accessory}
              outfit={outfit}
              onBack={() => setView("chat")}
            />
          ) : null}
          {view === "my" ? (
            <OutfitView
              profile={profile}
              outfit={outfit}
              accessory={accessory}
              selectedOutfit={selectedOutfit}
              rewardSummary={rewardSummary}
              leaderboard={leaderboard}
              tasks={tasks}
              completedTaskIds={completedTaskIds}
              onSelect={setOutfit}
              onAccessorySelect={setAccessory}
              onCompleteTask={completeTask}
            />
          ) : null}
        </section>

        {view !== "welcome" ? (
          <nav className="bottom-nav" aria-label="application navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>
                  <Icon size={22} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : null}
      </main>
    </div>
  );
}

function WelcomeView({
  state,
  accessory,
  outfit,
  accent,
  onStart
}: {
  state: VirtualPetState;
  accessory: PetAccessoryId;
  outfit: OutfitId;
  accent: string;
  onStart: () => void;
}) {
  return (
    <section className="app-screen welcome-page">
      <div className="logo-container" aria-hidden="true">
        <div className="logo-glow" />
        <div className="brand-logo">
          <img src="assets/brand/logo-paw-smile.jpg" alt="" draggable={false} />
        </div>
      </div>
      <h1 className="brand-name">毛球伙伴</h1>
      <p className="welcome-slogan">
        让<span>陪伴</span>有温度
        <br />
        让<span>记录</span>有故事
        <br />
        让<span>爱</span>被看见
      </p>
      <div className="welcome-pet">
        <PetFigure state={state} accessory={accessory} outfit={outfit} accent={accent} large />
      </div>
      <button className="start-button" onClick={onStart}>
        开始陪伴
      </button>
      <span className="welcome-caption">
        数字生命桌宠
        <Heart size={15} aria-hidden="true" />
      </span>
    </section>
  );
}

function MarketView({
  petName,
  latest,
  baseline,
  inventoryItems
}: {
  petName: string;
  latest: DailySummary;
  baseline: ReturnType<typeof buildBaseline>;
  inventoryItems: InventoryItem[];
}) {
  const [category, setCategory] = useState<MarketCategory>("all");
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const products = category === "all" ? marketProducts : marketProducts.filter((product) => product.category === category);
  const selectedProduct = marketProducts.find((product) => product.id === selectedProductId);
  const activeCategory = marketCategories.find((item) => item.id === category) || marketCategories[0];
  const marketInsight = buildMarketInsight(category, petName, latest, baseline, inventoryItems);

  return (
    <section className="app-screen scroll-screen market-screen">
      <MobileTopNav title="宠物市集" subtitle={`${activeCategory.label}推荐`} />

      <div className="category-tabs">
        {marketCategories.map((item) => (
          <button
            key={item.id}
            className={category === item.id ? "active" : ""}
            onClick={() => {
              setCategory(item.id);
              if (item.id !== category) setSelectedProductId(undefined);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="market-banner">
        <div>
          <span>{marketInsight.badge}</span>
          <h2>{marketInsight.title}</h2>
          <p>{marketInsight.summary}</p>
        </div>
      </section>

      {selectedProduct ? (
        <section className="detail-sheet" aria-label="商品详情">
          <button className="sheet-close" onClick={() => setSelectedProductId(undefined)}>
            收起
          </button>
          <div className={`sheet-art product-sheet-art ${selectedProduct.art}`}>
            <img src={selectedProduct.image} alt={selectedProduct.imageAlt} />
          </div>
          <span>{selectedProduct.tag}</span>
          <h2>{selectedProduct.title}</h2>
          <p>{selectedProduct.detail}</p>
          <small className="asset-credit">
            图片来源：
            <a href={selectedProduct.sourceUrl} target="_blank" rel="noreferrer">
              {selectedProduct.sourceName}
            </a>
          </small>
          <strong>¥{selectedProduct.price}</strong>
          <button className="primary-pill">加入购物车</button>
        </section>
      ) : null}

      <div className="product-grid">
        {products.map((product) => (
          <button key={product.id} className="product-card" onClick={() => setSelectedProductId(product.id)}>
            <div className={`product-image ${product.art}`}>
              <img src={product.image} alt={product.imageAlt} />
              <span>{product.tag}</span>
            </div>
            <div className="product-info">
              <strong>{product.title}</strong>
              <p>{product.reason}</p>
              <span>¥{product.price}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function formatMarketDays(daysRemaining: number | undefined) {
  if (typeof daysRemaining !== "number") return "不足 2 天";
  return `${daysRemaining.toFixed(1)} 天`;
}

function buildMarketInsight(category: MarketCategory, petName: string, latest: DailySummary, baseline: ReturnType<typeof buildBaseline>, inventoryItems: InventoryItem[]) {
  const foodItem = inventoryItems.find((item) => item.category === "food");
  const foodDays = formatMarketDays(foodItem?.daysRemaining);
  const scratchLift = Math.max(0, latest.scratchMinutes - baseline.scratchMinutes);
  const sleepDrop = Math.max(0, baseline.sleepScore - latest.sleepScore);
  const waterDrop = Math.max(0, baseline.waterMl - latest.waterMl);
  const scratchText = scratchLift > 0 ? `抓挠 ${latest.scratchMinutes} 分钟，比平时多 ${scratchLift} 分钟` : `抓挠 ${latest.scratchMinutes} 分钟`;

  const copy: Record<MarketCategory, { badge: string; title: string; summary: string }> = {
    all: {
      badge: `${petName} 今日照护`,
      title: "先补货，再看皮肤",
      summary: `主粮只剩 ${foodDays}，${scratchText}，今晚优先补低敏主粮、局部清洁和低强度玩具。`
    },
    food: {
      badge: "主粮告急",
      title: "补同蛋白低敏配方",
      summary: `三文鱼主粮只剩 ${foodDays}，${petName}不能碰鸡肉，先补同蛋白来源，避免临时换粮。`
    },
    care: {
      badge: "腹部复查",
      title: "先做局部清洁",
      summary: `${scratchText}，已有腹部红点记录；今晚用无香湿巾清洁后复查，不安排完整洗澡。`
    },
    toy: {
      badge: "低强度互动",
      title: "用嗅闻替代追球",
      summary: `睡眠分比平时低 ${sleepDrop} 分，今晚用嗅闻垫消耗精力，避免高兴奋追逐。`
    },
    health: {
      badge: "皮肤观察",
      title: "保健只做辅助入口",
      summary: `饮水比平时少 ${waterDrop} ml，抓挠仍在观察期；保健品不替代兽医判断，恶化先就医。`
    }
  };

  return copy[category];
}

function getTaskPoints(task: DailyTask) {
  const priorityPoints: Record<DailyTask["priority"], number> = {
    high: 35,
    medium: 24,
    low: 14
  };
  const typeBonus: Partial<Record<DailyTask["type"], number>> = {
    skin_check: 10,
    walk: 8,
    inventory: 6,
    feed: 5,
    water: 5,
    training: 5,
    groom: 5,
    rest: 4,
    play: 4
  };

  return priorityPoints[task.priority] + (typeBonus[task.type] || 0);
}

function buildRewardSummary(tasks: DailyTask[], completedTaskIds: Set<string>): RewardSummary {
  const availablePoints = tasks.reduce((sum, task) => sum + getTaskPoints(task), 0);
  const completedTasks = tasks.filter((task) => completedTaskIds.has(task.id));
  const dailyPoints = completedTasks.reduce((sum, task) => sum + getTaskPoints(task), 0);
  const totalTasks = tasks.length;
  const progressPct = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  return {
    dailyPoints,
    availablePoints,
    completedTasks: completedTasks.length,
    totalTasks,
    streakDays: 4 + completedTasks.length,
    weeklyPoints: 318 + dailyPoints,
    progressPct
  };
}

function buildCareLeaderboard(petName: string, rewardSummary: RewardSummary): LeaderboardEntry[] {
  const entries: Omit<LeaderboardEntry, "rank">[] = [
    { petName: "Nori", ownerLabel: "晨跑家庭", points: 438, completedTasks: 6, streakDays: 9, badge: "晨间巡逻" },
    { petName: "芝麻", ownerLabel: "梳毛小队", points: 407, completedTasks: 5, streakDays: 8, badge: "护理达人" },
    { petName, ownerLabel: "旺财家庭", points: rewardSummary.weeklyPoints, completedTasks: rewardSummary.completedTasks, streakDays: rewardSummary.streakDays, badge: "今日照护", self: true },
    { petName: "Biscuit", ownerLabel: "低敏联盟", points: 362, completedTasks: 4, streakDays: 6, badge: "稳定喂食" },
    { petName: "Luna", ownerLabel: "睡眠守护", points: 335, completedTasks: 4, streakDays: 5, badge: "安静夜晚" }
  ];

  return entries
    .sort((a, b) => b.points - a.points)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function buildRewardUnlocks(rewardSummary: RewardSummary): RewardUnlock[] {
  return [
    {
      id: "reward_patrol_medal",
      title: "巡逻奖章",
      rewardType: "accessory",
      linkedCatalogId: "acc-medal",
      conditionLabel: "今日完成 4 项照护任务",
      progressValue: Math.min(rewardSummary.completedTasks, 4),
      targetValue: 4,
      unlocked: rewardSummary.completedTasks >= 4,
      detail: "来自每日任务奖励。完成喂食、补水、散步和护理后，可在我的装扮配饰里使用。"
    },
    {
      id: "reward_birthday_bandana",
      title: "生日丝巾",
      rewardType: "outfit",
      linkedCatalogId: "party",
      conditionLabel: "本周照护积分达到 390 分",
      progressValue: Math.min(rewardSummary.weeklyPoints, 390),
      targetValue: 390,
      unlocked: rewardSummary.weeklyPoints >= 390,
      detail: "来自本周照护积分奖励。适合完成连续照护后作为陪伴装扮预览。"
    },
    {
      id: "reward_streak_badge",
      title: "连续照护徽章",
      rewardType: "badge",
      conditionLabel: "连续照护达到 7 天",
      progressValue: Math.min(rewardSummary.streakDays, 7),
      targetValue: 7,
      unlocked: rewardSummary.streakDays >= 7,
      detail: "用于用户激励页和后续分享卡，不直接改变桌宠外观。"
    }
  ];
}

function CommunityView({ petName }: { petName: string }) {
  const [query, setQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | undefined>();
  const keyword = query.trim().toLowerCase();
  const communityFeed = communityPosts.map((post) =>
    post.id === "post_1"
      ? {
          ...post,
          title: `${petName} 今天完成了低强度巡逻，回来主动喝水。`,
          author: `@${petName}`
        }
      : post
  );
  const posts = keyword
    ? communityFeed.filter((post) =>
        [post.title, post.author, post.detail, ...post.tags].some((text) => text.toLowerCase().includes(keyword))
      )
    : communityFeed;
  const selectedPost = communityFeed.find((post) => post.id === selectedPostId);

  return (
    <section className="app-screen scroll-screen community-screen">
      <MobileTopNav title="宠物社区" subtitle="照护经验流" />

      <div className="search-box">
        <MessageCircle size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索抓挠、装扮、训练..." aria-label="搜索社区内容" />
      </div>

      {selectedPost ? (
        <section className="detail-sheet" aria-label="帖子详情">
          <button className="sheet-close" onClick={() => setSelectedPostId(undefined)}>
            返回社区
          </button>
          <div className={`sheet-art post-sheet-art ${selectedPost.tone}`}>
            <img src={selectedPost.image} alt={selectedPost.imageAlt} />
          </div>
          <span>{selectedPost.author}</span>
          <h2>{selectedPost.title}</h2>
          <p>{selectedPost.detail}</p>
          <small className="asset-credit">
            图片来源：
            <a href={selectedPost.sourceUrl} target="_blank" rel="noreferrer">
              {selectedPost.sourceName}
            </a>
          </small>
          <div className="tag-row">
            {selectedPost.tags.map((tag) => (
              <em key={tag}>{tag}</em>
            ))}
          </div>
        </section>
      ) : null}

      <div className="waterfall">
        {posts.map((post) => (
          <button key={post.id} className={`post-card ${post.tone}`} onClick={() => setSelectedPostId(post.id)}>
            <div className="post-image">
              <img src={post.image} alt={post.imageAlt} />
            </div>
            <div className="post-content">
              <strong>{post.title}</strong>
              <p>{post.detail}</p>
              <div>
                <span>{post.author}</span>
                <em>{post.likes}</em>
              </div>
            </div>
          </button>
        ))}
      </div>

      {posts.length === 0 ? <p className="empty-state">没有找到相关帖子，换个关键词试试。</p> : null}
    </section>
  );
}

function MobileTopNav({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mobile-top-nav">
      <div className="mobile-title">
        <strong>{title}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
    </header>
  );
}

function ChatHome({
  profile,
  state,
  accessory,
  outfit,
  accent,
  context
}: {
  profile: PetProfile;
  state: VirtualPetState;
  accessory: PetAccessoryId;
  outfit: OutfitId;
  accent: string;
  context: AgentContextSnapshot;
}) {
  const initialMessages = useMemo(() => createInitialAgentMessages(context), [context]);
  const [messages, setMessages] = useState<AgentChatMessage[]>(() => initialMessages);
  const [composerText, setComposerText] = useState("");
  const [responseMode, setResponseMode] = useState<AgentResponseMode>("text");
  const [loading, setLoading] = useState(false);
  const [activeMotion, setActiveMotion] = useState<ExpressionCommand | undefined>();
  const threadRef = useRef<HTMLDivElement>(null);
  const hydratedThreadRef = useRef<string | null>(null);
  const localActivityRef = useRef(false);
  const sendInFlightRef = useRef(false);
  const persona = getPersonaForProfile(profile);
  const profileIdentity = getPetDisplayIdentity(profile);
  const threadId = mainThreadIdForPet(profile);

  useEffect(() => {
    if (hydratedThreadRef.current === threadId) return;
    let cancelled = false;

    async function hydrateThread() {
      try {
        const response = await fetch(apiUrl(`/api/agent/threads/${encodeURIComponent(threadId)}/messages`), { cache: "no-store" });
        const data = response.ok ? ((await response.json()) as { messages?: AgentChatMessage[] }) : undefined;
        if (cancelled) return;
        const persistedMessages = Array.isArray(data?.messages) ? data.messages : [];
        const hydratedMessages = persistedMessages.length ? normalizeMessagesForDisplay(persistedMessages) : initialMessages;
        setMessages((current) => (localActivityRef.current ? mergeMessages(current, hydratedMessages) : hydratedMessages));

        const proactiveResponse = await fetch(apiUrl(`/api/agent/threads/${encodeURIComponent(threadId)}/proactive`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: { ...context, mainThreadId: threadId } })
        });
        const proactive = proactiveResponse.ok
          ? ((await proactiveResponse.json()) as { message?: AgentChatMessage; motionCommand?: ExpressionCommand; motion?: { active?: ExpressionCommand } })
          : undefined;
        if (cancelled) return;
        if (proactive?.message) setMessages((current) => mergeMessages(current, [proactive.message as AgentChatMessage]));
        if (proactive?.motion?.active || proactive?.motionCommand) setActiveMotion(proactive.motion?.active || proactive.motionCommand);
        hydratedThreadRef.current = threadId;
      } catch {
        if (!cancelled && !localActivityRef.current) setMessages(initialMessages);
      }
    }

    void hydrateThread();
    return () => {
      cancelled = true;
    };
  }, [context, initialMessages, threadId]);

  useEffect(() => {
    let cancelled = false;

    async function syncThreadMessages() {
      try {
        const response = await fetch(apiUrl(`/api/agent/threads/${encodeURIComponent(threadId)}/messages`), { cache: "no-store" });
        const data = response.ok ? ((await response.json()) as { messages?: AgentChatMessage[] }) : undefined;
        if (cancelled || !Array.isArray(data?.messages) || !data.messages.length) return;
        setMessages((current) => mergeMessages(current, normalizeMessagesForDisplay(data.messages || [])));
      } catch {
        // The chat stays usable if the runtime polling endpoint is unavailable.
      }
    }

    const interval = window.setInterval(syncThreadMessages, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [threadId]);

  useEffect(() => {
    let cancelled = false;

    async function syncDesktopMotion() {
      try {
        const response = await fetch(apiUrl("/api/desktop-pet/motion"), { cache: "no-store" });
        if (!response.ok) return;
        const snapshot = (await response.json()) as { active?: ExpressionCommand };
        if (cancelled) return;
        setActiveMotion((current) => (current?.id === snapshot.active?.id ? current : snapshot.active));
      } catch {
        // The chat page still works as a local preview when the API process is not running.
      }
    }

    void syncDesktopMotion();
    const interval = window.setInterval(syncDesktopMotion, 900);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!activeMotion?.ttlMs) return;
    const timer = window.setTimeout(() => {
      setActiveMotion((current) => (current?.id === activeMotion.id ? undefined : current));
    }, activeMotion.ttlMs);
    return () => window.clearTimeout(timer);
  }, [activeMotion]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const thread = threadRef.current;
      if (!thread) return;
      thread.scrollTo({ top: thread.scrollHeight, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages.length, loading]);

  function playVoiceMessage(message: AgentChatMessage) {
    const speakWithBrowser = () => {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.lang = "zh-CN";
      utterance.rate = 1.04;
      utterance.pitch = 1.08;
      window.speechSynthesis.speak(utterance);
    };

    if (message.audioBase64 && message.audioContentType) {
      const audio = new Audio(`data:${message.audioContentType};base64,${message.audioBase64}`);
      void audio.play().catch(speakWithBrowser);
      return;
    }

    speakWithBrowser();
  }

  async function sendMessage() {
    const input = composerText.trim();
    if (!input || loading || sendInFlightRef.current) return;
    sendInFlightRef.current = true;

    const createdAt = new Date().toISOString();
    const clientTurnId = createClientId("turn");
    const clientMessageId = createClientId("user");
    const userMessage: AgentChatMessage = {
      id: clientMessageId,
      speaker: "user",
      authorName: persona.userDisplayName,
      text: input,
      createdAt,
      clientTurnId,
      responseMode: "text"
    };
    const nextHistory = [...messages, userMessage];
    localActivityRef.current = true;
    setMessages(nextHistory);
    setComposerText("");
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), AGENT_REPLY_TIMEOUT_MS);

    try {
      const response = await fetch(apiUrl("/api/agent/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          responseMode,
          threadId,
          history: nextHistory,
          clientMessageId,
          clientTurnId,
          clientCreatedAt: createdAt,
          context: { ...context, mainThreadId: threadId }
        }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`agent_http_${response.status}`);
      const data = (await response.json()) as {
        provider?: string;
        answer?: string;
        message?: AgentChatMessage;
        motionCommand?: ExpressionCommand;
        motion?: { active?: ExpressionCommand };
      };
      const petMessage: AgentChatMessage = data.message || {
        id: `pet-${Date.now()}`,
        speaker: "pet",
        authorName: persona.displayName,
        text: data.answer || `${persona.displayName}听到了，但这次没有组织好回复。`,
        createdAt: new Date().toISOString(),
        responseMode,
        provider: data.provider
      };
      setMessages((current) => mergeMessages(current, [userMessage, petMessage]));
      if (petMessage.responseMode === "voice") playVoiceMessage(petMessage);
      if (data.motion?.active || data.motionCommand) setActiveMotion(data.motion?.active || data.motionCommand);
    } catch {
      const localTurn = createLocalAgentTurn(input, { ...context, mainThreadId: threadId }, responseMode);
      const petCreatedAt = new Date().toISOString();
      const localMessage: AgentChatMessage = {
        id: `pet-${petCreatedAt}`,
        speaker: "pet",
        authorName: persona.displayName,
        text: localTurn.answer,
        createdAt: petCreatedAt,
        clientTurnId,
        responseMode,
        provider: "client-local-agent-fallback",
        voiceProvider: responseMode === "voice" ? "browser-speech-fallback" : undefined,
        toolCards: localTurn.toolCards
      };
      setMessages((current) => mergeMessages(current, [userMessage, localMessage]));
      if (localMessage.responseMode === "voice") playVoiceMessage(localMessage);
      if (localTurn.motionCommand) setActiveMotion(localTurn.motionCommand);
    } finally {
      window.clearTimeout(timeoutId);
      sendInFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <section className="app-screen chat-screen">
      <MobileTopNav title={persona.groupName} subtitle={`${profileIdentity.displayName} · ${persona.userDisplayName} · 主群聊`} />

      <div className="chat-pet-stage" aria-hidden="true">
        <div className="online-pill">
          <span />
          主群聊在线
        </div>
        <PetFigure state={state} accessory={accessory} outfit={outfit} accent={accent} motionAction={activeMotion?.action} large />
        {activeMotion ? <div className="active-motion-pill">正在{motionActionLabels[activeMotion.action] || activeMotion.action}</div> : null}
      </div>

      <div className="chat-thread" ref={threadRef}>
        <div className="chat-date">今天 09:30</div>
        <div className="group-members">
          <span>{profileIdentity.displayName}</span>
          <span>{persona.userDisplayName}</span>
          <span>可加入家人/医生/代遛</span>
        </div>

        <div className="message-list">
          {messages.map((message) => {
            const visibleToolCards = getVisibleToolCards(message);
            return (
              <div key={message.id} className={`message ${message.speaker}`}>
                {message.speaker === "pet" ? (
                  <div className="message-identity">
                    <em>{message.authorName}</em>
                    <PetProfileAvatar profile={profile} className="message-avatar" />
                  </div>
                ) : null}
                <div className="message-stack">
                  {message.speaker !== "pet" ? <em>{message.authorName}</em> : null}
                  <button
                    className={`message-bubble ${message.responseMode === "voice" ? "voice-bubble" : ""}`}
                    onClick={() => {
                      if (message.responseMode === "voice") playVoiceMessage(message);
                    }}
                  >
                    {message.responseMode === "voice" ? <Volume2 size={17} /> : null}
                    <span>{message.text}</span>
                  </button>
                  {visibleToolCards.length ? (
                    <div className="tool-card-row">
                      {visibleToolCards.map((card) => (
                        <span key={card.id} className={`tool-card ${card.kind}`}>
                          <strong>{card.title}</strong>
                          <small>{formatToolCardDetail(card)}</small>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
          {loading ? <ChatWaitingCue petName={persona.displayName} /> : null}
        </div>
      </div>

      <footer className="chat-composer">
        <div className="mode-switch" aria-label="reply mode">
          <button className={responseMode === "text" ? "active" : ""} onClick={() => setResponseMode("text")} aria-label="text reply mode">
            <Keyboard size={17} />
          </button>
          <button className={responseMode === "voice" ? "active" : ""} onClick={() => setResponseMode("voice")} aria-label="voice reply mode">
            <Mic2 size={17} />
          </button>
        </div>
        <input
          className="composer-field"
          value={composerText}
          placeholder={`和${profileIdentity.displayName}说话`}
          onChange={(event) => setComposerText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          aria-label="message"
        />
        <button aria-label="send" disabled={loading || !composerText.trim()} onClick={() => void sendMessage()}>
          <Send size={18} />
        </button>
      </footer>
    </section>
  );
}

type StatusSheetId = "history" | "report";
type StatusTone = "sleep" | "activity" | "food" | "alert" | "rest";
type StatusModuleTone = "sleep" | "activity" | "rest";
type HealthTrend = "up" | "down" | "stable";
type HealthColor = "blue" | "green" | "pink";
type HealthMetricId = "activity" | "sleep" | "diet" | "behavior" | "heart" | "respiration" | "temperature";
type StatusChartTone = "green" | "orange" | "blue" | "pink";

type HealthMetricChartPoint = {
  label: string;
  height: number;
  tone: StatusChartTone;
  value: string;
};

type StatusMetricModule = {
  id: StatusModuleTone;
  metricId: HealthMetricId;
  title: string;
  duration: string;
  note: string;
  icon: ReactNode;
  items: Array<{ label: string; value: string; opacity?: number; basis?: string }>;
  score: number;
  trend: HealthTrend;
  color: HealthColor | "orange";
  analysis: string;
  warning?: boolean;
  chart: HealthMetricChartPoint[];
  detailRows: Array<{ label: string; value: string; tone?: "normal" | "warn" | "good" }>;
};

type StatusAlertEvent = {
  id: string;
  badge: "WATCH" | "RESOLVED";
  name: string;
  time: string;
  summary: string;
  rows: Array<{ label: string; value: string; negative?: boolean }>;
  aiDiagnosis: string;
};

type HealthDimension = {
  metricId: HealthMetricId;
  name: string;
  score: number;
  trend: HealthTrend;
  color: HealthColor;
  analysis: string;
  warn?: boolean;
};

type HealthMetric = {
  id: HealthMetricId;
  label: string;
  value: string;
  baseline: string;
  trend: HealthTrend;
  color: HealthColor | "orange";
  chart: HealthMetricChartPoint[];
  analysis: string;
  rows: Array<{ label: string; value: string; tone?: "normal" | "warn" | "good" }>;
};

type HealthReport = {
  title: string;
  date: string;
  score: number;
  dims: HealthDimension[];
  metrics: HealthMetric[];
  alerts: Array<{ text: string; badge: StatusAlertEvent["badge"] }>;
  alertAnalysis: string;
  advice: string[];
};

function StatusDataView({
  profile,
  state,
  latest,
  baseline,
  packet,
  accessory,
  outfit,
  onBack
}: {
  profile: PetProfile;
  state: VirtualPetState;
  latest: DailySummary;
  baseline: ReturnType<typeof buildBaseline>;
  packet: StreamPacket;
  accessory: PetAccessoryId;
  outfit: OutfitId;
  onBack: () => void;
}) {
  const profileIdentity = getPetDisplayIdentity(profile);
  const trend = dailySummaries.slice(-7);
  const alerts = useMemo(() => buildStatusAlerts(dailySummaries, baseline), [baseline]);
  const reports = useMemo(() => buildHealthReports(dailySummaries, baseline), [baseline]);
  const [selectedDate, setSelectedDate] = useState(latest.date);
  const [activeSheet, setActiveSheet] = useState<StatusSheetId | null>(null);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [activeMetricId, setActiveMetricId] = useState<HealthMetricId>("activity");
  const [weekIndex, setWeekIndex] = useState(0);
  const selectedDaily = trend.find((item) => item.date === selectedDate) || latest;
  const selectedAlert = buildStatusAlert(selectedDaily, baseline, selectedDaily.date === latest.date);
  const statusSnapshot = buildStatusSnapshot(selectedDaily, selectedAlert, packet, profileIdentity.displayName);
  const modules = buildStatusMetricModules(selectedDaily, trend, baseline);
  const report = reports[weekIndex] || reports[0];
  const activeMetric = report.metrics.find((metric) => metric.id === activeMetricId) || report.metrics[0];

  function switchWeek(direction: number) {
    setWeekIndex((current) => Math.min(Math.max(current + direction, 0), reports.length - 1));
  }

  function openMetric(metricId: HealthMetricId) {
    setActiveMetricId(metricId);
    setActiveSheet("report");
  }

  return (
    <section className="app-screen status-screen">
      <div className="status-main-scroll">
        <header className="status-top-nav">
          <button className="status-nav-circle" onClick={onBack} aria-label="返回对话">
            <ArrowLeft size={19} />
          </button>
          <div className="status-title-group">
            <strong>状态监测</strong>
            <span>{formatMonthDay(selectedDaily.date)} 数据已同步</span>
          </div>
          <button className="status-nav-circle" aria-label="状态设置">
            <Settings size={18} />
          </button>
        </header>

        <div className="status-quick-actions">
          <button className="history" onClick={() => setActiveSheet("history")}>
            <AlertTriangle size={17} />
            异常历史
          </button>
          <button
            className="health"
            onClick={() => {
              setActiveMetricId("activity");
              setActiveSheet("report");
            }}
          >
            <FileText size={17} />
            健康评估
          </button>
        </div>

        <section className="status-pet-card">
          <div className="status-pet-photo">
            <PetFigure state={state} accessory={accessory} outfit={outfit} accent="#ff8f73" />
            {statusSnapshot.showSleepCue ? (
              <div className="status-zzz" aria-hidden>
                <span>Z</span>
                <span>Z</span>
                <span>Z</span>
              </div>
            ) : null}
          </div>
          <div className="status-pet-info">
            <div className="status-location-line">
              <MapPin size={14} />
              <span>{formatGeofence(packet.location.geofence)}</span>
            </div>
            <div className="status-main-line">
              <span className={`status-pulse-dot ${statusSnapshot.tone}`} />
              <strong>{statusSnapshot.label}</strong>
            </div>
            <p>{statusSnapshot.description}</p>
          </div>
        </section>

        <div className="status-calendar-strip">
          {trend.map((item) => {
            const date = new Date(`${item.date}T00:00:00+08:00`);
            return (
              <button key={item.date} className={selectedDate === item.date ? "active" : ""} onClick={() => setSelectedDate(item.date)}>
                <span>{weekdayCn(date)}</span>
                <strong>{item.date.slice(8)}</strong>
              </button>
            );
          })}
        </div>

        <div className="status-data-modules">
          {modules.map((module) => (
            <StatusDataModule key={module.id} module={module} onOpenMetric={() => openMetric(module.metricId)} />
          ))}
        </div>

      </div>

      <button className={`status-overlay ${activeSheet ? "active" : ""}`} aria-label="关闭状态面板" onClick={() => setActiveSheet(null)} />

      <aside className={`status-drawer status-history-drawer ${activeSheet === "history" ? "open" : ""}`} aria-label="异常历史">
        <div className="status-panel-header">
          <span>异常历史</span>
          <button onClick={() => setActiveSheet(null)} aria-label="关闭异常历史">
            <X size={16} />
          </button>
        </div>
        <div className="status-panel-body">
          {alerts.map((alert) => {
            const expanded = expandedAlertId === alert.id;
            const toggleCurrentAlert = () => setExpandedAlertId(expanded ? null : alert.id);
            return (
              <article
                key={alert.id}
                className={`status-alert-card ${expanded ? "expanded" : ""}`}
                role="button"
                tabIndex={0}
                onClick={toggleCurrentAlert}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleCurrentAlert();
                  }
                }}
              >
                <div className="status-alert-header">
                  <span className={`status-alert-badge ${alert.badge.toLowerCase()}`}>{alert.badge}</span>
                  <span className="status-alert-info">
                    <span className="status-alert-title-row">
                      <strong>{alert.name}</strong>
                      <em>{alert.time}</em>
                    </span>
                    <span>{alert.summary}</span>
                  </span>
                  <ChevronDown size={16} />
                </div>
                <div className="status-alert-detail">
                  <div className="status-alert-detail-inner">
                    <div className="status-detail-section-title">
                      <Clock3 size={14} />
                      具体数据
                    </div>
                    {alert.rows.map((row) => (
                      <div className="status-detail-row" key={row.label}>
                        <span>{row.label}</span>
                        <strong className={row.negative ? "negative" : ""}>{row.value}</strong>
                      </div>
                    ))}
                    <div className="status-ai-diagnosis">
                      <div>
                        <span>AI</span>
                        <strong>智能诊断分析</strong>
                      </div>
                      <p>{alert.aiDiagnosis}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </aside>

      <aside className={`status-drawer status-health-drawer ${activeSheet === "report" ? "open" : ""}`} aria-label="健康评估报告">
        <div className="status-panel-header">
          <span>健康评估报告</span>
          <button onClick={() => setActiveSheet(null)} aria-label="关闭健康评估报告">
            <X size={16} />
          </button>
        </div>
        <div className="status-week-selector">
          <button onClick={() => switchWeek(1)} aria-label="上一周">
            <ChevronLeft size={18} />
          </button>
          <strong>{report.title}</strong>
          <button onClick={() => switchWeek(-1)} aria-label="下一周">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="status-panel-body status-health-body">
          <section className="status-score-card">
            <div className="status-score-ring">
              <svg viewBox="0 0 100 100" aria-hidden>
                <circle className="score-bg" cx="50" cy="50" r="40" />
                <circle className="score-fill" cx="50" cy="50" r="40" strokeDasharray={251} strokeDashoffset={251 - (report.score / 100) * 251} />
              </svg>
              <span>{report.score}</span>
            </div>
            <p>综合健康评分</p>
            <em>{report.date}</em>
          </section>

          <section className="status-health-section">
            <div className="status-health-title">
              <HeartPulse size={18} />
              健康维度分析
            </div>
            {report.dims.map((dim) => (
              <button
                type="button"
                className={`status-dimension-block ${activeMetric.id === dim.metricId ? "active" : ""}`}
                key={dim.name}
                onClick={() => setActiveMetricId(dim.metricId)}
                aria-pressed={activeMetric.id === dim.metricId}
              >
                <div className="status-dimension-row">
                  <span>{dim.name}</span>
                  <div>
                    <i className={dim.color} style={{ width: `${dim.score}%` }} />
                  </div>
                  <strong>{dim.score}</strong>
                  <StatusTrendBadge trend={dim.trend} />
                </div>
                <p className={dim.warn ? "warning" : ""}>{dim.analysis}</p>
              </button>
            ))}
          </section>

          <section className="status-health-section">
            <div className="status-health-title">
              <BarChart3 size={18} />
              {activeMetric.label}趋势
            </div>
            <div className="status-metric-tabs" role="tablist" aria-label="健康指标">
              {report.metrics.map((metric) => (
                <button
                  type="button"
                  key={metric.id}
                  className={`${metric.color} ${activeMetric.id === metric.id ? "active" : ""}`}
                  onClick={() => setActiveMetricId(metric.id)}
                  role="tab"
                  aria-selected={activeMetric.id === metric.id}
                >
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <em>{metric.baseline}</em>
                </button>
              ))}
            </div>
            <div className="status-mini-chart">
              {activeMetric.chart.map((bar) => (
                <span key={bar.label} className={bar.tone} style={{ height: `${bar.height}%` }} title={`${bar.label} ${bar.value}`}>
                  <em>{bar.label}</em>
                </span>
              ))}
            </div>
            <p className="status-analysis-text">{activeMetric.analysis}</p>
            <div className="status-metric-detail-grid">
              {activeMetric.rows.map((row) => (
                <div key={row.label} className={row.tone || "normal"}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="status-health-section">
            <div className="status-health-title">
              <AlertTriangle size={18} />
              本周异常事件
            </div>
            {report.alerts.map((item) => (
              <div className="status-week-alert" key={item.text}>
                <span>{item.text}</span>
                <StatusBadge badge={item.badge} />
              </div>
            ))}
            <p className="status-analysis-text">{report.alertAnalysis}</p>
          </section>

          <section className="status-health-section">
            <div className="status-health-title">
              <Lightbulb size={18} />
              本周健康建议
            </div>
            <div className="status-health-advice">
              <strong>AI 综合建议</strong>
              {report.advice.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </section>
  );
}

function StatusDataModule({
  module,
  onOpenMetric
}: {
  module: StatusMetricModule;
  onOpenMetric: () => void;
}) {
  return (
    <article className={`status-data-module ${module.id}`}>
      <button className="status-module-header" type="button" onClick={onOpenMetric} aria-label={`查看${module.title}趋势`}>
        <span className="status-module-icon">{module.icon}</span>
        <div>
          <em>{module.title}</em>
          <strong>
            {module.duration}
            <small>{module.note}</small>
          </strong>
        </div>
        <span className="status-module-more" aria-label={`${module.title}展开详情`}>
          <MoreVertical size={16} />
        </span>
      </button>
      <div className="status-sub-items">
        {module.items.map((item) => (
          <button className="status-sub-item" type="button" key={item.label} onClick={onOpenMetric}>
            <span style={{ opacity: item.opacity ?? 1 }} />
            <em>{item.label}</em>
            <strong>{item.value}</strong>
          </button>
        ))}
      </div>
    </article>
  );
}

function StatusBadge({ badge }: { badge: StatusAlertEvent["badge"] }) {
  return <span className={`status-alert-badge ${badge.toLowerCase()}`}>{badge === "WATCH" ? "待观察" : "已恢复"}</span>;
}

function StatusTrendBadge({ trend }: { trend: HealthTrend }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const label = trend === "up" ? "上升" : trend === "down" ? "下降" : "持平";
  return (
    <span className={`status-trend-badge ${trend}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}

function weekdayCn(date: Date) {
  return ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
}

function formatMonthDay(date: string) {
  return date.slice(5).replace("-", "-");
}

function formatGeofence(geofence: StreamPacket["location"]["geofence"]) {
  if (geofence === "park") return "梅溪湖小公园";
  if (geofence === "outside_safe_zone") return "安全围栏外";
  return "旺财大宅";
}

function formatDurationMinutes(minutes: number) {
  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return hours > 0 ? `${hours}时${String(rest).padStart(2, "0")}分` : `${rounded}分`;
}

function formatDurationClock(minutes: number) {
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded >= 60) return formatDurationMinutes(rounded);
  const totalSeconds = Math.max(0, Math.round(minutes * 60));
  const mins = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (seconds === 0) return `${mins}分`;
  return `${mins}分${String(seconds).padStart(2, "0")}秒`;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function healthTrend(value: number, baselineValue: number): HealthTrend {
  const delta = value - baselineValue;
  if (delta > 4) return "up";
  if (delta < -4) return "down";
  return "stable";
}

function formatDateRange(week: DailySummary[]) {
  const start = week[0]?.date || "";
  const end = week[week.length - 1]?.date || "";
  if (!start || !end) return "";
  return `2026年${Number(start.slice(5, 7))}月${Number(start.slice(8))}日 - ${Number(end.slice(5, 7))}月${Number(end.slice(8))}日`;
}

function buildStatusSnapshot(daily: DailySummary, alert: StatusAlertEvent, packet: StreamPacket, petName: string): { label: string; description: string; tone: StatusTone; showSleepCue: boolean } {
  if (alert.badge === "WATCH") {
    return {
      label: "异常待观察",
      description: alert.summary,
      tone: "alert",
      showSleepCue: false
    };
  }

  if (packet.activityState === "sleep" || daily.sleepScore >= 80) {
    return {
      label: "睡眠中",
      description: `${petName}美梦生成中 ZZZ`,
      tone: "sleep",
      showSleepCue: true
    };
  }

  if (packet.activityState === "walk" || packet.activityState === "active" || packet.activityState === "play" || daily.activityIndex >= 78) {
    return {
      label: "活动中",
      description: `${petName}正在活动，今日运动节奏可继续保持。`,
      tone: "activity",
      showSleepCue: false
    };
  }

  if (daily.foodGrams >= 155) {
    return {
      label: "进食正常",
      description: `${petName}今日进食接近计划量，晚餐继续按原方案。`,
      tone: "food",
      showSleepCue: false
    };
  }

  return {
    label: "休息中",
    description: `${petName}当前状态平稳，继续观察饮水和抓挠变化。`,
    tone: "rest",
    showSleepCue: false
  };
}

function buildModuleChart(
  trend: DailySummary[],
  valueOf: (item: DailySummary) => number,
  baselineValue: number,
  tone: "green" | "orange" | "blue" | "pink",
  lowIsBad = true
) {
  return trend.map((item) => {
    const date = new Date(`${item.date}T00:00:00+08:00`);
    const value = valueOf(item);
    const isWarning = lowIsBad ? value < baselineValue - 8 : value > baselineValue + 3;
    return {
      label: weekdayCn(date),
      height: Math.max(18, Math.min(96, Math.round(value))),
      tone: isWarning ? ("orange" as const) : tone,
      value: String(value)
    };
  });
}

function buildStatusMetricModules(daily: DailySummary, trend: DailySummary[], baseline: ReturnType<typeof buildBaseline>): StatusMetricModule[] {
  const sleepTotal = Math.max(150, Math.round(daily.sleepScore * 3));
  const deepSleep = Math.round(sleepTotal * (daily.sleepScore >= 78 ? 0.63 : 0.56));
  const lightSleep = sleepTotal - deepSleep;
  const activityTotal = Math.max(18, daily.activeMinutes + Math.round(daily.playMinutes * 0.7));
  const walk = Math.round(activityTotal * 0.58);
  const run = Math.round(activityTotal * 0.18);
  const roll = Math.round(activityTotal * 0.14);
  const jump = Math.max(2, activityTotal - walk - run - roll);
  const leisureTotal = Math.max(80, Math.round(daily.restMinutes * 0.22));
  const sniff = Math.round(leisureTotal * 0.28);
  const eating = Math.max(12, Math.round(daily.foodGrams / 6));
  const daze = Math.round(leisureTotal * 0.2);
  const lick = Math.max(8, daily.scratchMinutes);
  const paw = Math.max(3, leisureTotal - sniff - eating - daze - lick);

  return [
    {
      id: "sleep",
      metricId: "sleep",
      title: "睡眠",
      duration: formatDurationMinutes(sleepTotal),
      note: " 今日总计",
      icon: <Moon size={20} />,
      items: [
        { label: "深度睡眠", value: formatDurationMinutes(deepSleep), basis: "占比稳定" },
        { label: "浅度睡眠", value: formatDurationMinutes(lightSleep), opacity: 0.5, basis: "夜醒观察" }
      ],
      score: daily.sleepScore,
      trend: healthTrend(daily.sleepScore, baseline.sleepScore),
      color: "blue",
      analysis: `深度睡眠占比约 ${Math.round((deepSleep / sleepTotal) * 100)}%，睡眠评分 ${daily.sleepScore}。静息心率 ${daily.restingHeartRateBpm} bpm 会作为夜间恢复质量的辅助判断。`,
      warning: daily.sleepScore < baseline.sleepScore - 8,
      chart: buildModuleChart(trend, (item) => item.sleepScore, baseline.sleepScore, "blue"),
      detailRows: [
        { label: "睡眠评分", value: `${daily.sleepScore}`, tone: daily.sleepScore < 72 ? "warn" : "good" },
        { label: "静息心率", value: `${daily.restingHeartRateBpm} bpm`, tone: daily.restingHeartRateBpm > baseline.restingHeartRateBpm + 5 ? "warn" : "normal" },
        { label: "静息呼吸", value: `${daily.restingRespirationRpm} rpm`, tone: daily.restingRespirationRpm > baseline.restingRespirationRpm + 3 ? "warn" : "normal" }
      ]
    },
    {
      id: "activity",
      metricId: "activity",
      title: "活动",
      duration: formatDurationClock(activityTotal),
      note: " 今日总计",
      icon: <Clock3 size={20} />,
      items: [
        { label: "行走", value: formatDurationClock(walk), basis: "低强度" },
        { label: "奔跑", value: formatDurationClock(run), opacity: 0.72, basis: "高强度" },
        { label: "打滚", value: formatDurationClock(roll), opacity: 0.5, basis: "玩耍" },
        { label: "跳跃", value: formatDurationClock(jump), opacity: 0.32, basis: "爆发" }
      ],
      score: daily.activityIndex,
      trend: healthTrend(daily.activityIndex, baseline.activityIndex),
      color: "green",
      analysis: `活动指数 ${daily.activityIndex}，约 ${daily.stepsEstimate.toLocaleString("zh-CN")} 步，距离 ${(daily.distanceMeters / 1000).toFixed(1)}km。低于基线时会触发低强度散步和嗅闻任务。`,
      warning: daily.activityIndex < baseline.activityIndex - 8,
      chart: buildModuleChart(trend, (item) => item.activityIndex, baseline.activityIndex, "green"),
      detailRows: [
        { label: "活动指数", value: `${daily.activityIndex}`, tone: daily.activityIndex < 68 ? "warn" : "good" },
        { label: "消耗热量", value: `${daily.caloriesKcal} kcal` },
        { label: "吠叫事件", value: `${daily.barkEvents} 次`, tone: daily.barkEvents > 18 ? "warn" : "normal" }
      ]
    },
    {
      id: "rest",
      metricId: "behavior",
      title: "休闲",
      duration: formatDurationMinutes(leisureTotal),
      note: " 今日总计",
      icon: <Layers size={20} />,
      items: [
        { label: "嗅闻", value: formatDurationClock(sniff), basis: "探索" },
        { label: "摄食", value: formatDurationClock(eating), opacity: 0.8, basis: "进食" },
        { label: "发呆", value: formatDurationClock(daze), opacity: 0.62, basis: "休息" },
        { label: "舔舐", value: formatDurationClock(lick), opacity: 0.42, basis: "皮肤" },
        { label: "磨爪", value: formatDurationClock(paw), opacity: 0.3, basis: "行为" }
      ],
      score: clampScore(100 - Math.max(0, daily.scratchMinutes - baseline.scratchMinutes) * 4),
      trend: daily.scratchMinutes > baseline.scratchMinutes + 3 ? "down" : "stable",
      color: "pink",
      analysis: `休闲总计 ${formatDurationMinutes(leisureTotal)}，舔舐/抓挠合计 ${formatDurationClock(lick)}。抓挠高于基线时会进入皮肤观察。`,
      warning: daily.scratchMinutes > baseline.scratchMinutes + 3,
      chart: buildModuleChart(trend, (item) => 100 - Math.max(0, item.scratchMinutes - baseline.scratchMinutes) * 4, 82, "pink"),
      detailRows: [
        { label: "进食量", value: `${daily.foodGrams}g`, tone: daily.foodGrams < 145 ? "warn" : "good" },
        { label: "饮水量", value: `${daily.waterMl}ml`, tone: daily.waterMl < 420 ? "warn" : "good" },
        { label: "抓挠时长", value: `${daily.scratchMinutes}分`, tone: daily.scratchMinutes > baseline.scratchMinutes + 3 ? "warn" : "normal" }
      ]
    }
  ];
}

function buildStatusAlert(daily: DailySummary, baseline: ReturnType<typeof buildBaseline>, isRecent: boolean): StatusAlertEvent {
  const foodDropPct = Math.max(0, Math.round(((baseline.foodGrams - daily.foodGrams) / baseline.foodGrams) * 100));
  const activityDropPct = Math.max(0, Math.round(((baseline.activityIndex - daily.activityIndex) / baseline.activityIndex) * 100));
  const scratchLift = Math.max(0, daily.scratchMinutes - baseline.scratchMinutes);
  const waterDropPct = Math.max(0, Math.round(((baseline.waterMl - daily.waterMl) / baseline.waterMl) * 100));
  const time = `${daily.date.slice(5)} ${isRecent ? "14:32" : "09:15"}`;
  const badge: StatusAlertEvent["badge"] = isRecent && (foodDropPct >= 10 || activityDropPct >= 10 || scratchLift >= 5 || waterDropPct >= 15 || daily.sleepScore < 72) ? "WATCH" : "RESOLVED";
  const rows = [
    { label: "早餐摄入量", value: `${daily.foodGrams}g（基线 ${baseline.foodGrams}g）`, negative: foodDropPct >= 10 },
    { label: "活动指数", value: `${daily.activityIndex}（基线 ${baseline.activityIndex}）`, negative: activityDropPct >= 10 },
    { label: "抓挠时长", value: `${daily.scratchMinutes}分（基线 ${baseline.scratchMinutes}分）`, negative: scratchLift >= 5 },
    { label: "饮水量", value: `${daily.waterMl}ml（基线 ${baseline.waterMl}ml）`, negative: waterDropPct >= 15 }
  ];

  if (foodDropPct >= 10 && scratchLift >= 5) {
    return {
      id: `food-scratch-${daily.date}`,
      badge,
      name: "进食下降 + 抓挠升高",
      time,
      summary: `早餐摄入低于7日基线${foodDropPct}%，抓挠较基线增加${scratchLift}分钟。`,
      rows,
      aiDiagnosis: "进食下降伴随抓挠升高，优先复查腹部红点、耳道和口腔状态。若出现渗液、疼痛或继续下降，应尽快联系兽医。"
    };
  }

  if (activityDropPct >= 10) {
    return {
      id: `activity-${daily.date}`,
      badge,
      name: "运动量显著偏低",
      time,
      summary: `活动指数较7日基线下降${activityDropPct}%，需要观察精神状态和进食恢复。`,
      rows,
      aiDiagnosis: "活动下降可能与天气、睡眠恢复或进食不足相关。今天先使用低强度嗅闻和短时散步，不建议直接高强度追逐。"
    };
  }

  if (daily.sleepScore < 72) {
    return {
      id: `sleep-${daily.date}`,
      badge,
      name: "睡眠质量偏低",
      time: `${daily.date.slice(5)} 02:18`,
      summary: `睡眠评分 ${daily.sleepScore}，低于近期稳定区间。`,
      rows,
      aiDiagnosis: "睡眠偏低时应减少晚间刺激，检查室温、噪音和皮肤不适。若次日自动恢复，可继续观察。"
    };
  }

  if (waterDropPct >= 15) {
    return {
      id: `water-${daily.date}`,
      badge,
      name: "饮水量偏低",
      time,
      summary: `饮水量较7日基线下降${waterDropPct}%，晚间需要补充新鲜水源。`,
      rows,
      aiDiagnosis: "饮水下降可能来自水碗位置、天气或活动减少。先更换清水并观察排便尿量，持续异常再升级处理。"
    };
  }

  return {
    id: `stable-${daily.date}`,
    badge: "RESOLVED",
    name: "状态稳定",
    time,
    summary: "今日核心指标接近近期基线。",
    rows,
    aiDiagnosis: "当前记录未触发新的异常阈值，保持喂食、散步和清洁节奏。"
  };
}

function buildStatusAlerts(daily: DailySummary[], baseline: ReturnType<typeof buildBaseline>) {
  const pick = (offsetFromEnd: number) => daily[Math.max(0, daily.length - 1 - offsetFromEnd)] || daily[daily.length - 1];
  const referenceDate = (item: DailySummary, time: string) => `${item.date.slice(5)} ${time}`;
  const foodScratchDay = pick(0);
  const latestFoodDrop = Math.max(0, Math.round(((baseline.foodGrams - foodScratchDay.foodGrams) / baseline.foodGrams) * 100));
  const latestScratchLift = Math.max(0, foodScratchDay.scratchMinutes - baseline.scratchMinutes);
  const lowActivityDrop = Math.max(32, Math.round(((baseline.activityIndex - pick(1).activityIndex) / baseline.activityIndex) * 100));
  const waterLift = Math.max(22, Math.round(((pick(5).waterMl - baseline.waterMl) / baseline.waterMl) * 100));
  const lickLift = Math.max(28, Math.round(((pick(6).scratchMinutes + 9 - baseline.scratchMinutes) / Math.max(1, baseline.scratchMinutes)) * 100));

  return [
    {
      id: `food-scratch-${foodScratchDay.date}`,
      badge: "WATCH" as const,
      name: "进食下降 + 抓挠升高",
      time: referenceDate(foodScratchDay, "14:32"),
      summary: `早餐摄入低于7日基线${latestFoodDrop}%，抓挠较基线增加${latestScratchLift}分钟。`,
      rows: [
        { label: "早餐摄入量", value: `${foodScratchDay.foodGrams}g（基线 ${baseline.foodGrams}g）`, negative: latestFoodDrop >= 10 },
        { label: "抓挠时长", value: `${foodScratchDay.scratchMinutes}分（基线 ${baseline.scratchMinutes}分）`, negative: latestScratchLift >= 5 },
        { label: "持续时间", value: "约 3 小时" }
      ],
      aiDiagnosis:
        "结合近7日数据分析，进食量下降可能与皮肤不适、口腔不适或环境变化相关。抓挠频率升高时建议先检查腹部是否有红点，并在今晚复查皮肤状况；如持续异常建议就医。"
    },
    {
      id: `activity-low-${pick(1).date}`,
      badge: "WATCH" as const,
      name: "运动量显著偏低",
      time: referenceDate(pick(1), "09:15"),
      summary: `活动量较7日基线下降${lowActivityDrop}%，持续静止超过4小时`,
      rows: [
        { label: "当日活动量", value: `${Math.max(28, pick(1).activeMinutes - 70)}分钟（基线 ${Math.max(58, baseline.activityIndex - 16)}分钟）`, negative: true },
        { label: "持续静止", value: "4小时12分", negative: true }
      ],
      aiDiagnosis:
        "运动量下降可能与气温、前日进食不足或睡眠恢复有关。如今日活动恢复正常可以继续观察；若持续偏低，需要关注精神状态、步态和进食恢复。"
    },
    {
      id: `night-wake-${pick(4).date}`,
      badge: "RESOLVED" as const,
      name: "夜间醒来频繁",
      time: referenceDate(pick(4), "02:18"),
      summary: "夜间醒来5次，较基线增加3次，已于次日恢复正常",
      rows: [
        { label: "夜间醒来次数", value: "5次（基线 2次）", negative: true },
        { label: "恢复时间", value: `${pick(3).date.slice(5)} 已恢复` }
      ],
      aiDiagnosis: "夜间醒来频繁可能由环境噪音或温度变化导致，该异常已于次日自动恢复，无需特别处理。"
    },
    {
      id: `water-high-${pick(5).date}`,
      badge: "RESOLVED" as const,
      name: "饮水频率升高",
      time: referenceDate(pick(5), "16:45"),
      summary: `饮水量较基线升高${waterLift}%，持续约2小时后恢复正常`,
      rows: [
        { label: "饮水量", value: `${Math.max(180, pick(5).waterMl - 320)}ml（基线 ${Math.max(148, baseline.waterMl - 330)}ml）` },
        { label: "持续时间", value: "约 2 小时" }
      ],
      aiDiagnosis:
        "短暂饮水频率升高可能与当日气温较高或运动后补水有关，该异常已自动恢复。若频繁出现，应继续关注尿量和肾脏相关指标。"
    },
    {
      id: `lick-high-${pick(6).date}`,
      badge: "WATCH" as const,
      name: "舔舐频率异常升高",
      time: referenceDate(pick(6), "11:20"),
      summary: `舔舐频率较基线升高${lickLift}%，持续约4小时`,
      rows: [
        { label: "舔舐频率", value: `${Math.max(32, pick(6).scratchMinutes + 18)}次/时（基线 25次）`, negative: true },
        { label: "持续时间", value: "约 4 小时", negative: true }
      ],
      aiDiagnosis:
        "舔舐频率升高可能来自局部瘙痒、皮肤干燥或焦虑代偿。建议检查四肢及腹部是否有红肿；若持续超过24小时，应安排进一步检查。"
    },
    {
      id: `night-activity-${pick(8).date}`,
      badge: "RESOLVED" as const,
      name: "深夜异常活动",
      time: referenceDate(pick(8), "02:45"),
      summary: "凌晨2:45检测到15分钟异常活动，随后恢复正常睡眠",
      rows: [
        { label: "活动时长", value: "15分钟" },
        { label: "恢复时间", value: `${pick(8).date.slice(5)} 03:00 已恢复` }
      ],
      aiDiagnosis: "深夜短暂活动可能由外界噪音引起，宠物短暂警觉后迅速恢复睡眠。该类偶发事件无需特别关注。"
    },
    {
      id: `eating-fast-${pick(10).date}`,
      badge: "WATCH" as const,
      name: "进食速度异常加快",
      time: referenceDate(pick(10), "08:30"),
      summary: "早餐进食速度较基线加快35%，2分钟内完成进食",
      rows: [
        { label: "进食速度", value: "2分钟（基线 5分钟）", negative: true },
        { label: "进食量", value: `正常（${Math.max(62, pick(10).foodGrams - 96)}g）` }
      ],
      aiDiagnosis:
        "进食速度加快但进食量正常，可能是前一餐间隔时间较长或正常波动。若持续加快，需要关注竞争性进食心理或消化系统问题。"
    }
  ];
}

function buildHealthMetricChart(
  week: DailySummary[],
  valueOf: (item: DailySummary) => number,
  formatValue: (value: number) => string,
  tone: StatusChartTone,
  isWarning: (value: number) => boolean
): HealthMetricChartPoint[] {
  const values = week.map(valueOf);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(1, max - min);

  return week.map((item) => {
    const value = valueOf(item);
    const date = new Date(`${item.date}T00:00:00+08:00`);
    return {
      label: weekdayCn(date),
      height: Math.round(26 + ((value - min) / spread) * 70),
      tone: isWarning(value) ? "orange" : tone,
      value: formatValue(value)
    };
  });
}

function buildHealthReports(daily: DailySummary[], baseline: ReturnType<typeof buildBaseline>): HealthReport[] {
  const weekChunks = [daily.slice(-7), daily.slice(-14, -7)].filter((week) => week.length > 0);

  return weekChunks.map((week, index) => {
    const avgSleep = clampScore(average(week.map((item) => item.sleepScore)));
    const avgActivity = clampScore(average(week.map((item) => item.activityIndex)));
    const avgFood = Math.round(average(week.map((item) => item.foodGrams)));
    const avgScratch = Math.round(average(week.map((item) => item.scratchMinutes)));
    const avgHeart = Math.round(average(week.map((item) => item.restingHeartRateBpm)));
    const avgRespiration = Math.round(average(week.map((item) => item.restingRespirationRpm)));
    const avgTemp = Number(average(week.map((item) => item.skinTempC)).toFixed(1));
    const dietScore = clampScore(100 - Math.abs(avgFood - baseline.foodGrams) * 1.25);
    const behaviorScore = clampScore(100 - Math.max(0, avgScratch - baseline.scratchMinutes) * 4);
    const alerts = buildStatusAlerts(week, baseline).slice(0, 3);
    const activityChart = buildHealthMetricChart(week, (item) => item.activityIndex, (value) => `${Math.round(value)}`, "green", (value) => value < baseline.activityIndex - 10);
    const sleepChart = buildHealthMetricChart(week, (item) => item.sleepScore, (value) => `${Math.round(value)}`, "blue", (value) => value < baseline.sleepScore - 8);
    const dietChart = buildHealthMetricChart(week, (item) => item.foodGrams, (value) => `${Math.round(value)}g`, "pink", (value) => value < baseline.foodGrams - 10);
    const behaviorChart = buildHealthMetricChart(
      week,
      (item) => item.scratchMinutes,
      (value) => `${Math.round(value)}分`,
      "pink",
      (value) => value > baseline.scratchMinutes + 3
    );
    const heartChart = buildHealthMetricChart(
      week,
      (item) => item.restingHeartRateBpm,
      (value) => `${Math.round(value)} bpm`,
      "green",
      (value) => value > baseline.restingHeartRateBpm + 5
    );
    const respirationChart = buildHealthMetricChart(
      week,
      (item) => item.restingRespirationRpm,
      (value) => `${Math.round(value)} rpm`,
      "blue",
      (value) => value > baseline.restingRespirationRpm + 3
    );
    const temperatureChart = buildHealthMetricChart(
      week,
      (item) => item.skinTempC,
      (value) => `${value.toFixed(1)}°C`,
      "orange",
      (value) => value > baseline.skinTempC + 0.2
    );
    const score = clampScore(avgSleep * 0.28 + avgActivity * 0.28 + dietScore * 0.22 + behaviorScore * 0.22);
    const title = index === 0 ? `本周（${Number(week[0].date.slice(5, 7))}月${Number(week[0].date.slice(8))}日 - ${Number(week[week.length - 1].date.slice(5, 7))}月${Number(week[week.length - 1].date.slice(8))}日）` : `上周（${Number(week[0].date.slice(5, 7))}月${Number(week[0].date.slice(8))}日 - ${Number(week[week.length - 1].date.slice(5, 7))}月${Number(week[week.length - 1].date.slice(8))}日）`;
    const metrics: HealthMetric[] = [
      {
        id: "activity",
        label: "活动",
        value: `${avgActivity}`,
        baseline: `基线 ${baseline.activityIndex}`,
        trend: healthTrend(avgActivity, baseline.activityIndex),
        color: "green",
        chart: activityChart,
        analysis: activityChart.some((item) => item.tone === "orange")
          ? "本周有部分日期活动低于基线，建议用低强度互动逐步恢复，不直接拉高运动强度。"
          : "本周活动量分布平稳，周末可维持同等散步和室内互动节奏。",
        rows: [
          { label: "平均活动指数", value: `${avgActivity}`, tone: avgActivity < baseline.activityIndex - 8 ? "warn" : "good" },
          { label: "平均步数", value: `${Math.round(average(week.map((item) => item.stepsEstimate))).toLocaleString("zh-CN")} 步` },
          { label: "平均消耗", value: `${Math.round(average(week.map((item) => item.caloriesKcal)))} kcal` }
        ]
      },
      {
        id: "sleep",
        label: "睡眠",
        value: `${avgSleep}`,
        baseline: `基线 ${baseline.sleepScore}`,
        trend: healthTrend(avgSleep, baseline.sleepScore),
        color: "blue",
        chart: sleepChart,
        analysis: `睡眠评分均值 ${avgSleep}，${avgSleep >= baseline.sleepScore ? "深睡和浅睡结构整体保持稳定。" : "低于近期基线，晚间应减少刺激并复查环境噪音、室温和皮肤不适。"}`,
        rows: [
          { label: "平均睡眠评分", value: `${avgSleep}`, tone: avgSleep < baseline.sleepScore - 8 ? "warn" : "good" },
          { label: "静息心率参考", value: `${avgHeart} bpm` },
          { label: "静息呼吸参考", value: `${avgRespiration} rpm` }
        ]
      },
      {
        id: "diet",
        label: "饮食",
        value: `${avgFood}g`,
        baseline: `基线 ${baseline.foodGrams}g`,
        trend: healthTrend(dietScore, 80),
        color: "pink",
        chart: dietChart,
        analysis: `平均进食 ${avgFood}g，近期基线 ${baseline.foodGrams}g。若继续下降，需要检查口腔、食物新鲜度和喂食环境。`,
        rows: [
          { label: "平均进食", value: `${avgFood}g`, tone: avgFood < baseline.foodGrams - 8 ? "warn" : "good" },
          { label: "平均饮水", value: `${Math.round(average(week.map((item) => item.waterMl)))}ml` },
          { label: "粪便评分", value: `${Number(average(week.map((item) => item.stoolQuality)).toFixed(1))}/5` }
        ]
      },
      {
        id: "behavior",
        label: "行为",
        value: `${avgScratch}分`,
        baseline: `基线 ${baseline.scratchMinutes}分`,
        trend: avgScratch > baseline.scratchMinutes + 3 ? "down" : "stable",
        color: "pink",
        chart: behaviorChart,
        analysis: `抓挠均值 ${avgScratch} 分钟，${avgScratch > baseline.scratchMinutes ? "高于基线，腹部红点需要复查。" : "未见明显异常行为。"}图表以抓挠/舔舐时长为主，橙色表示超过观察阈值。`,
        rows: [
          { label: "平均抓挠", value: `${avgScratch}分`, tone: avgScratch > baseline.scratchMinutes + 3 ? "warn" : "good" },
          { label: "平均吠叫", value: `${Math.round(average(week.map((item) => item.barkEvents)))} 次` },
          { label: "休息时长", value: formatDurationMinutes(Math.round(average(week.map((item) => item.restMinutes)))) }
        ]
      },
      {
        id: "heart",
        label: "心率",
        value: `${avgHeart} bpm`,
        baseline: `基线 ${baseline.restingHeartRateBpm} bpm`,
        trend: healthTrend(avgHeart, baseline.restingHeartRateBpm),
        color: "green",
        chart: heartChart,
        analysis: `静息心率均值 ${avgHeart} bpm，基线 ${baseline.restingHeartRateBpm} bpm。持续高于基线时，要结合活动、睡眠和皮肤不适一起判断。`,
        rows: [
          { label: "本周均值", value: `${avgHeart} bpm`, tone: avgHeart > baseline.restingHeartRateBpm + 5 ? "warn" : "good" },
          { label: "最高值", value: `${Math.max(...week.map((item) => item.restingHeartRateBpm))} bpm` },
          { label: "最低值", value: `${Math.min(...week.map((item) => item.restingHeartRateBpm))} bpm` }
        ]
      },
      {
        id: "respiration",
        label: "呼吸",
        value: `${avgRespiration} rpm`,
        baseline: `基线 ${baseline.restingRespirationRpm} rpm`,
        trend: healthTrend(avgRespiration, baseline.restingRespirationRpm),
        color: "blue",
        chart: respirationChart,
        analysis: `静息呼吸均值 ${avgRespiration} rpm，基线 ${baseline.restingRespirationRpm} rpm。若与心率、体温同步升高，应优先排查环境温度和身体不适。`,
        rows: [
          { label: "本周均值", value: `${avgRespiration} rpm`, tone: avgRespiration > baseline.restingRespirationRpm + 3 ? "warn" : "good" },
          { label: "最高值", value: `${Math.max(...week.map((item) => item.restingRespirationRpm))} rpm` },
          { label: "最低值", value: `${Math.min(...week.map((item) => item.restingRespirationRpm))} rpm` }
        ]
      },
      {
        id: "temperature",
        label: "体温",
        value: `${avgTemp.toFixed(1)}°C`,
        baseline: `基线 ${baseline.skinTempC.toFixed(1)}°C`,
        trend: healthTrend(avgTemp, baseline.skinTempC),
        color: "orange",
        chart: temperatureChart,
        analysis: `皮温均值 ${avgTemp.toFixed(1)}°C，基线 ${baseline.skinTempC.toFixed(1)}°C。橙色日期代表超过近期皮温观察阈值。`,
        rows: [
          { label: "本周均值", value: `${avgTemp.toFixed(1)}°C`, tone: avgTemp > baseline.skinTempC + 0.2 ? "warn" : "good" },
          { label: "最高值", value: `${Math.max(...week.map((item) => item.skinTempC)).toFixed(1)}°C` },
          { label: "最低值", value: `${Math.min(...week.map((item) => item.skinTempC)).toFixed(1)}°C` }
        ]
      }
    ];

    return {
      title,
      date: formatDateRange(week),
      score,
      dims: [
        {
          metricId: "sleep",
          name: "睡眠",
          score: avgSleep,
          trend: healthTrend(avgSleep, baseline.sleepScore),
          color: "blue",
          analysis: `睡眠评分均值 ${avgSleep}，深睡和浅睡结构整体${avgSleep >= baseline.sleepScore ? "保持稳定" : "低于近期基线"}。`
        },
        {
          metricId: "activity",
          name: "活动",
          score: avgActivity,
          trend: healthTrend(avgActivity, baseline.activityIndex),
          color: "green",
          warn: avgActivity < baseline.activityIndex - 8,
          analysis: `活动指数均值 ${avgActivity}，${avgActivity < baseline.activityIndex ? "本周活动偏低，适合增加短时散步和嗅闻互动。" : "本周活动节奏较好，可维持当前运动量。"}`
        },
        {
          metricId: "diet",
          name: "饮食",
          score: dietScore,
          trend: healthTrend(dietScore, 80),
          color: "pink",
          warn: avgFood < baseline.foodGrams - 8,
          analysis: `平均进食 ${avgFood}g，近期基线 ${baseline.foodGrams}g。若继续下降，需要检查口腔和食物新鲜度。`
        },
        {
          metricId: "behavior",
          name: "行为",
          score: behaviorScore,
          trend: avgScratch > baseline.scratchMinutes + 3 ? "down" : "stable",
          color: "blue",
          warn: avgScratch > baseline.scratchMinutes + 3,
          analysis: `抓挠均值 ${avgScratch} 分钟，${avgScratch > baseline.scratchMinutes ? "高于基线，腹部红点需要复查。" : "未见明显异常行为。"}`
        }
      ],
      metrics,
      alerts: alerts.map((item) => ({ text: `${item.time.slice(0, 5)} ${item.name}`, badge: item.badge })),
      alertAnalysis:
        alerts.length > 0
          ? `本周共触发 ${alerts.length} 次异常记录，重点关注进食、抓挠和活动恢复。`
          : "本周没有新的异常记录。",
      advice: [
        "晚间继续复查腹部红点，记录照片变化。",
        "活动恢复先使用短时散步和嗅闻垫，避免过度兴奋。",
        "进食下降时先确认食物新鲜度和口腔状态，再考虑换粮。"
      ]
    };
  });
}

function OutfitView({
  profile,
  outfit,
  accessory,
  selectedOutfit,
  rewardSummary,
  leaderboard,
  tasks,
  completedTaskIds,
  onSelect,
  onAccessorySelect,
  onCompleteTask
}: {
  profile: PetProfile;
  outfit: OutfitId;
  accessory: PetAccessoryId;
  selectedOutfit: OutfitOption;
  rewardSummary: RewardSummary;
  leaderboard: LeaderboardEntry[];
  tasks: DailyTask[];
  completedTaskIds: Set<string>;
  onSelect: (value: OutfitId) => void;
  onAccessorySelect: (value: PetAccessoryId) => void;
  onCompleteTask: (taskId: string) => void;
}) {
  const [myMode, setMyMode] = useState<MyPageMode>("home");
  const [activeTab, setActiveTab] = useState<OutfitTab>("服装");
  const [selectedLeaderboardPet, setSelectedLeaderboardPet] = useState<string | undefined>();
  const [selectedAppearance, setSelectedAppearance] = useState<Record<Exclude<OutfitTab, "服装" | "配饰">, string>>({
    毛发: passiveAppearanceCatalog.毛发[0].id,
    妆容: passiveAppearanceCatalog.妆容[0].id
  });
  const [draftAccessory, setDraftAccessory] = useState<PetAccessoryId>(accessory);
  const [savedLabel, setSavedLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewMotionIndex, setPreviewMotionIndex] = useState(0);
  const activeItems = activeTab === "服装" ? outfitOptions : activeTab === "配饰" ? accessoryOptions : passiveAppearanceCatalog[activeTab];
  const selectedItem =
    activeTab === "服装"
      ? selectedOutfit
      : activeTab === "配饰"
        ? accessoryOptions.find((item) => item.id === draftAccessory) || accessoryOptions[0]
        : passiveAppearanceCatalog[activeTab].find((item) => item.id === selectedAppearance[activeTab]) || passiveAppearanceCatalog[activeTab][0];
  const currentAccessory = accessoryOptions.find((item) => item.id === accessory) || accessoryOptions[0];
  const previewAccessory = activeTab === "配饰" ? draftAccessory : accessory;
  const previewMotion = outfitPreviewMotionSequence[previewMotionIndex] || "idle";
  const profileIdentity = getPetDisplayIdentity(profile);
  const statusLabel = savedLabel || (activeTab === "配饰" ? `桌宠配饰：${currentAccessory.label}` : `预览：${selectedItem.label}`);
  const selfRank = leaderboard.find((entry) => entry.self)?.rank || "-";
  const selectedLeaderboardEntry = leaderboard.find((entry) => entry.petName === (selectedLeaderboardPet || leaderboard.find((item) => item.self)?.petName)) || leaderboard[0];
  const remainingTasks = Math.max(0, rewardSummary.totalTasks - rewardSummary.completedTasks);
  const rewardUnlocks = useMemo(() => buildRewardUnlocks(rewardSummary), [rewardSummary]);
  const rewardByCatalogId = useMemo(() => new Map(rewardUnlocks.filter((reward) => reward.linkedCatalogId).map((reward) => [reward.linkedCatalogId, reward])), [rewardUnlocks]);
  const unlockedRewardCount = rewardUnlocks.filter((reward) => reward.unlocked).length;
  const selectedReward = rewardByCatalogId.get(selectedItem.id);
  const taskPriorityLabel: Record<DailyTask["priority"], string> = {
    high: "高优先级",
    medium: "中优先级",
    low: "低优先级"
  };

  useEffect(() => {
    setDraftAccessory(accessory);
  }, [accessory]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPreviewMotionIndex((current) => (current + 1) % outfitPreviewMotionSequence.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  function isSelected(item: OutfitOption | AppearanceOption | AccessoryOption) {
    if (activeTab === "服装") return item.id === outfit;
    if (activeTab === "配饰") return item.id === draftAccessory;
    return item.id === selectedAppearance[activeTab];
  }

  function selectItem(item: OutfitOption | AppearanceOption | AccessoryOption) {
    setSavedLabel("");
    if (activeTab === "服装") {
      onSelect(item.id as OutfitId);
      return;
    }
    if (activeTab === "配饰") {
      setDraftAccessory(item.id as PetAccessoryId);
      return;
    }
    setSelectedAppearance((current) => ({ ...current, [activeTab]: item.id }));
  }

  async function saveAppearance() {
    if (selectedReward && !selectedReward.unlocked) {
      setSavedLabel(`未解锁：${selectedItem.label}，${selectedReward.conditionLabel}`);
      return;
    }

    if (activeTab !== "配饰") {
      setSavedLabel(`已保留预览：${selectedItem.label}`);
      return;
    }

    const selectedAccessory = selectedItem as AccessoryOption;
    setIsSaving(true);
    try {
      const response = await fetch(apiUrl("/api/desktop-pet/appearance"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petId: profile.id, accessoryId: draftAccessory })
      });
      if (!response.ok) throw new Error(`appearance_${response.status}`);
      const synced = await response.json() as { accessoryLabel?: string };
      onAccessorySelect(draftAccessory);
      setSavedLabel(draftAccessory === "none" ? "已保存：无配饰" : `已保存：${synced.accessoryLabel || selectedAccessory.label}`);
    } catch {
      setSavedLabel("保存失败，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  }

  if (myMode === "knowledge") {
    return <KnowledgeBaseView onBack={() => setMyMode("home")} />;
  }

  if (myMode === "incentive") {
    return (
      <section className="app-screen scroll-screen outfit-screen incentive-screen">
        <div className="my-subpage-header">
          <button className="my-back-button" onClick={() => setMyMode("home")} aria-label="返回我的">
            <ArrowLeft size={18} />
          </button>
          <MobileTopNav title="用户激励" subtitle="每日任务 · 积分 · 排行 · 奖励" />
        </div>

        <section className="incentive-card" aria-label="用户激励概览">
          <div className="challenge-head">
            <span>
              <Trophy size={16} />
              本周照护积分
            </span>
            <strong>{rewardSummary.weeklyPoints}</strong>
            <em>今日已获得 {rewardSummary.dailyPoints}/{rewardSummary.availablePoints} 分，剩余 {remainingTasks} 项任务，已解锁 {unlockedRewardCount}/{rewardUnlocks.length} 个奖励。</em>
          </div>
          <div className="incentive-stats">
            <span>
              <strong>{rewardSummary.streakDays}</strong>
              连续天数
            </span>
            <span>
              <strong>{rewardSummary.completedTasks}/{rewardSummary.totalTasks}</strong>
              今日任务
            </span>
            <span>
              <strong>#{selfRank}</strong>
              本周排名
            </span>
          </div>
        </section>

        <div className="incentive-link-grid" aria-label="用户激励详情入口">
          <button className="incentive-link-card" onClick={() => setMyMode("tasks")}>
            <span>
              <Clock3 size={18} />
              每日任务
            </span>
            <strong>{remainingTasks > 0 ? `${remainingTasks} 项待完成` : "今日已完成"}</strong>
            <p>查看任务说明、时间窗口和完成奖励。</p>
            <ChevronRight size={19} />
          </button>

          <button className="incentive-link-card" onClick={() => setMyMode("leaderboard")}>
            <span>
              <BarChart3 size={18} />
              排行榜
            </span>
            <strong>当前排名 #{selfRank}</strong>
            <p>查看本周照护积分排行，点击任一宠物看明细。</p>
            <ChevronRight size={19} />
          </button>

          <button className="incentive-link-card" onClick={() => setMyMode("rewards")}>
            <span>
              <Sparkles size={18} />
              奖励 / 可解锁服饰
            </span>
            <strong>{unlockedRewardCount}/{rewardUnlocks.length} 个已解锁</strong>
            <p>查看奖励服饰和配饰的来源、条件和当前进度。</p>
            <ChevronRight size={19} />
          </button>
        </div>
      </section>
    );
  }

  if (myMode === "tasks") {
    return (
      <section className="app-screen scroll-screen outfit-screen incentive-screen">
        <div className="my-subpage-header">
          <button className="my-back-button" onClick={() => setMyMode("incentive")} aria-label="返回用户激励">
            <ArrowLeft size={18} />
          </button>
          <MobileTopNav title="每日任务" subtitle={`${rewardSummary.completedTasks}/${rewardSummary.totalTasks} 已完成`} />
        </div>

        <section className="task-progress-card" aria-label="今日任务进度">
          <div>
            <span>今日积分</span>
            <strong>{rewardSummary.dailyPoints}/{rewardSummary.availablePoints}</strong>
          </div>
          <div className="task-progress-track">
            <span style={{ width: `${rewardSummary.progressPct}%` }} />
          </div>
          <p>{remainingTasks > 0 ? `还有 ${remainingTasks} 项任务未完成。` : "今日任务已经全部完成。"}</p>
        </section>

        <div className="task-detail-list" aria-label="每日任务详情">
          {tasks.map((task) => {
            const done = completedTaskIds.has(task.id);
            const points = getTaskPoints(task);
            return (
              <button key={task.id} className={done ? "task-detail-card done" : "task-detail-card"} onClick={() => !done && onCompleteTask(task.id)} aria-pressed={done}>
                <span className="task-status-pill">{done ? "已完成" : "未完成"} · +{points}</span>
                <strong>{task.title}</strong>
                <p>{task.reason}</p>
                <em>{taskPriorityLabel[task.priority]} · {task.dueWindow}</em>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (myMode === "leaderboard") {
    return (
      <section className="app-screen scroll-screen outfit-screen incentive-screen">
        <div className="my-subpage-header">
          <button className="my-back-button" onClick={() => setMyMode("incentive")} aria-label="返回用户激励">
            <ArrowLeft size={18} />
          </button>
          <MobileTopNav title="排行榜" subtitle="本周照护积分" />
        </div>

        <div className="leaderboard-detail-list" aria-label="排行榜列表">
          {leaderboard.map((entry) => {
            const selected = selectedLeaderboardEntry?.petName === entry.petName;
            return (
              <button
                key={`${entry.petName}-${entry.rank}`}
                className={[entry.self ? "leaderboard-detail-row self" : "leaderboard-detail-row", selected ? "selected" : ""].filter(Boolean).join(" ")}
                onClick={() => setSelectedLeaderboardPet(entry.petName)}
              >
                <b>#{entry.rank}</b>
                <div>
                  <strong>{entry.petName}</strong>
                  <span>{entry.ownerLabel} · {entry.badge}</span>
                </div>
                <em>{entry.points} 分</em>
              </button>
            );
          })}
        </div>

        {selectedLeaderboardEntry ? (
          <section className={selectedLeaderboardEntry.self ? "leaderboard-detail-card self" : "leaderboard-detail-card"} aria-label="排行详情">
            <span>{selectedLeaderboardEntry.self ? "当前宠物" : selectedLeaderboardEntry.ownerLabel}</span>
            <strong>#{selectedLeaderboardEntry.rank} {selectedLeaderboardEntry.petName}</strong>
            <p>{selectedLeaderboardEntry.badge} · 完成 {selectedLeaderboardEntry.completedTasks} 项任务 · 连续 {selectedLeaderboardEntry.streakDays} 天</p>
            <em>{selectedLeaderboardEntry.points} 分</em>
          </section>
        ) : null}
      </section>
    );
  }

  if (myMode === "rewards") {
    return (
      <section className="app-screen scroll-screen outfit-screen incentive-screen">
        <div className="my-subpage-header">
          <button className="my-back-button" onClick={() => setMyMode("incentive")} aria-label="返回用户激励">
            <ArrowLeft size={18} />
          </button>
          <MobileTopNav title="奖励 / 可解锁服饰" subtitle={`${unlockedRewardCount}/${rewardUnlocks.length} 已解锁`} />
        </div>

        <div className="reward-detail-list" aria-label="奖励解锁列表">
          {rewardUnlocks.map((reward) => {
            const progressPct = reward.targetValue > 0 ? Math.min(100, Math.round((reward.progressValue / reward.targetValue) * 100)) : 0;
            return (
              <article key={reward.id} className={reward.unlocked ? "reward-detail-card unlocked" : "reward-detail-card"}>
                <span>{reward.unlocked ? "已解锁" : "进行中"} · {reward.rewardType === "accessory" ? "配饰" : reward.rewardType === "outfit" ? "服饰" : reward.rewardType === "badge" ? "徽章" : "道具"}</span>
                <strong>{reward.title}</strong>
                <p>{reward.detail}</p>
                <em>{reward.conditionLabel}</em>
                <div className="reward-progress-track" aria-label={`${reward.title} 解锁进度 ${progressPct}%`}>
                  <span style={{ width: `${progressPct}%` }} />
                </div>
                <b>{reward.progressValue}/{reward.targetValue}</b>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="app-screen scroll-screen outfit-screen">
      <MobileTopNav title="我的" subtitle="档案 · 用户激励 · 装扮" />

      <header className="profile-strip">
        <PetProfileAvatar
          profile={profile}
          className="profile-avatar"
          fallback={<PetFigure state={{ currentAnimation: "idle" }} accessory={accessory} outfit={outfit} accent={selectedOutfit.accent} />}
        />
        <div className="profile-copy">
          <h1>{profileIdentity.displayName}</h1>
          <p>{profile.breed} · {Math.round(profile.ageMonths / 12)} 岁</p>
        </div>
      </header>

      <div className="my-quick-actions" aria-label="我的页快捷入口">
        <button className="my-incentive-entry" onClick={() => setMyMode("incentive")}>
          <span>
            <Trophy size={17} />
            用户激励
          </span>
          <strong>本周 {rewardSummary.weeklyPoints} 分</strong>
          <p>今日 {rewardSummary.completedTasks}/{rewardSummary.totalTasks} 项 · 排名 #{selfRank} · 奖励 {unlockedRewardCount}/{rewardUnlocks.length}</p>
          <ChevronRight size={18} />
        </button>

        <button className="my-knowledge-entry" onClick={() => setMyMode("knowledge")}>
          <span>
            <Layers size={16} />
            宠物知识库
          </span>
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="outfit-tabs">
        {outfitTabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className="costume-grid">
        {activeItems.map((item) => {
          const reward = rewardByCatalogId.get(item.id);
          const locked = Boolean(reward && !reward.unlocked);
          return (
            <button key={item.id} className={[isSelected(item) ? "selected" : "", locked ? "locked" : ""].filter(Boolean).join(" ")} onClick={() => selectItem(item)}>
              <span className="costume-thumb" style={{ "--swatch": item.accent } as CSSProperties}>
                <img src={item.thumbnailImage || item.image} alt="" draggable={false} />
              </span>
              {reward ? <span className={reward.unlocked ? "costume-reward-badge unlocked" : "costume-reward-badge"}>{reward.unlocked ? "奖励已解锁" : "奖励未解锁"}</span> : null}
              <strong>{item.label}</strong>
              <em>{reward ? `${item.meta} · ${reward.conditionLabel}` : item.meta}</em>
            </button>
          );
        })}
      </div>

      <div className="outfit-stage">
        <span className="outfit-token">{selectedItem.token}</span>
        <MochiMotionAvatar
          motion={previewMotion}
          accessoryId={previewAccessory}
          large
          className="outfit-motion-preview"
          aria-label={`${selectedItem.label} 动态预览`}
        />
      </div>

      <button className="save-button" onClick={saveAppearance} disabled={isSaving}>
        {selectedReward && !selectedReward.unlocked ? "查看解锁条件" : activeTab === "配饰" ? "保存配饰" : "保留预览"}
      </button>

      <div className="sync-note">
        <Sparkles size={17} />
        <span>{statusLabel}</span>
      </div>
    </section>
  );
}

function CareView({
  tasks,
  recommendations
}: {
  tasks: ReturnType<typeof planDailyTasks>;
  recommendations: ReturnType<typeof recommendProducts>;
}) {
  return (
    <section className="app-screen scroll-screen care-screen">
      <MobileTopNav title="任务报告" subtitle="今日照护计划" />

      <section className="care-summary">
        <span>今天优先</span>
        <strong>{tasks.filter((task) => task.priority === "high").length} 项高优先级</strong>
        <p>把异常观察、喂食、补水和后续推荐放在同一条照护链路里。</p>
      </section>

      <div className="task-column">
        {tasks.slice(0, 4).map((task) => (
          <article key={task.id} className={`care-task ${task.priority}`}>
            <Clock3 size={18} />
            <div>
              <strong>{task.title}</strong>
              <p>{task.reason}</p>
              <span>{task.dueWindow}</span>
            </div>
            <ChevronRight size={18} />
          </article>
        ))}
      </div>

      <section className="commerce-strip">
        <div className="section-heading">
          <span>后续商业入口</span>
          <strong>{recommendations.length} 条推荐</strong>
        </div>
        <div className="product-row">
          {recommendations.slice(0, 3).map((product) => (
            <article key={product.id}>
              <ShoppingBag size={17} />
              <strong>{product.title}</strong>
              <span>¥{product.priceCny}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="report-card">
        <Trophy size={18} />
        <div>
          <strong>周报摘要</strong>
          <p>活动低于基线，抓挠上升；建议减少高强度奔跑，今晚完成腹部复查。</p>
        </div>
      </section>
    </section>
  );
}

function DateSelector({
  days,
  selectedDate,
  onSelect
}: {
  days: DailySummary[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const weekday = ["日", "一", "二", "三", "四", "五", "六"];
  return (
    <div className="date-selector">
      {days.map((item) => {
        const date = new Date(`${item.date}T00:00:00+08:00`);
        return (
        <button key={item.date} className={selectedDate === item.date ? "active" : ""} onClick={() => onSelect(item.date)}>
          <span>{weekday[date.getDay()]}</span>
          <strong>{item.date.slice(8)}</strong>
        </button>
        );
      })}
    </div>
  );
}

function DataSummaryCard({
  icon,
  label,
  value,
  detail,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "sleep" | "activity" | "food" | "scratch" | "water" | "location";
}) {
  return (
    <article className={`data-summary-card ${tone}`}>
      <div className="data-card-header">
        <span>{icon}</span>
        <em>{label}</em>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function PetProfileAvatar({ profile, className, fallback }: { profile: PetProfile; className?: string; fallback?: ReactNode }) {
  const identity = getPetDisplayIdentity(profile);
  const classes = ["pet-profile-avatar", className || ""].filter(Boolean).join(" ");

  return (
    <div className={classes} aria-label={`${identity.displayName} 头像`}>
      {identity.profileImageUrl ? <img src={identity.profileImageUrl} alt={`${identity.displayName} 头像`} /> : fallback || <span>{identity.displayName.slice(0, 1)}</span>}
    </div>
  );
}

function PetFigure({
  state,
  accessory,
  motionAction,
  large
}: {
  state: Pick<VirtualPetState, "currentAnimation">;
  accessory: PetAccessoryId;
  outfit: OutfitId;
  accent: string;
  motionAction?: PetMotionAction;
  large?: boolean;
}) {
  return <MochiMotionAvatar state={state} motionAction={motionAction} accessoryId={accessory} large={large} aria-hidden />;
}

function buildBaseline(daily: DailySummary[]) {
  const recent = daily.slice(0, -1);
  return {
    foodGrams: Math.round(average(recent.map((item) => item.foodGrams))),
    activityIndex: Math.round(average(recent.map((item) => item.activityIndex))),
    sleepScore: Math.round(average(recent.map((item) => item.sleepScore))),
    scratchMinutes: Math.round(average(recent.map((item) => item.scratchMinutes))),
    waterMl: Math.round(average(recent.map((item) => item.waterMl))),
    restingHeartRateBpm: Math.round(average(recent.map((item) => item.restingHeartRateBpm))),
    restingRespirationRpm: Math.round(average(recent.map((item) => item.restingRespirationRpm))),
    skinTempC: Number(average(recent.map((item) => item.skinTempC)).toFixed(1))
  };
}

function buildAnomaly(latest: DailySummary, baseline: ReturnType<typeof buildBaseline>) {
  const foodDropPct = Math.round(((baseline.foodGrams - latest.foodGrams) / baseline.foodGrams) * 100);
  const activityDropPct = Math.round(((baseline.activityIndex - latest.activityIndex) / baseline.activityIndex) * 100);
  const scratchLift = latest.scratchMinutes - baseline.scratchMinutes;

  return {
    level: "WATCH",
    title: "进食下降 + 抓挠升高",
    detail: `早餐摄入低于 7 日基线 ${foodDropPct}%，活动指数下降 ${activityDropPct}%，抓挠增加 ${scratchLift} 分钟。建议今晚复查腹部红点。`
  };
}
