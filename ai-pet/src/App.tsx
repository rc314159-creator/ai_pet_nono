import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bone,
  CalendarDays,
  ChevronRight,
  Clock3,
  Droplets,
  FileText,
  HeartPulse,
  Keyboard,
  MapPin,
  MessageCircle,
  Mic2,
  Moon,
  PawPrint,
  Scissors,
  Send,
  Shirt,
  ShoppingBag,
  Sparkles,
  SunMedium,
  Trophy,
  Utensils,
  UserRound,
  Volume2,
  UsersRound,
  Waves
} from "lucide-react";
import { createInitialAgentMessages, createLocalAgentTurn, getPersonaForProfile, mainThreadIdForPet } from "./domain/agent";
import { average, computeVirtualState, currentPacket, latestDaily, planDailyTasks, recommendProducts } from "./domain/engine";
import { dailySummaries, inventory, manualObservations, petProfiles, productCatalog, streamPackets } from "./domain/mockData";
import type { AgentChatMessage, AgentContextSnapshot, AgentResponseMode } from "./domain/agent";
import type { DailySummary, ExpressionCommand, PetMotionAction, PetProfile, VirtualPetState } from "./domain/types";

type ViewId = "market" | "community" | "chat" | "status" | "my";
type AppViewId = "welcome" | ViewId;
type OutfitId = "trail" | "rain" | "party";
type MarketCategory = "all" | "food" | "care" | "toy" | "health";
type OutfitTab = "服装" | "毛发" | "妆容" | "配饰";

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
}> = [
  {
    id: "food_salmon",
    category: "food",
    title: "三文鱼低敏肠胃主粮 2kg",
    price: 189,
    tag: "低敏主粮",
    reason: "当前库存低于 2 天，且避开鸡肉过敏源。",
    detail: "Mock 推荐：适合敏感肠胃、控制体重和稳定晚间喂食节奏。",
    art: "food"
  },
  {
    id: "care_wipes",
    category: "care",
    title: "无香低敏宠物清洁湿巾 80 片",
    price: 39,
    tag: "腹部护理",
    reason: "抓挠上升，今晚需要复查腹部红点。",
    detail: "Mock 推荐：散步后擦拭腹部和脚掌，用于低刺激清洁。",
    art: "care"
  },
  {
    id: "toy_snuffle",
    category: "toy",
    title: "可水洗嗅闻垫",
    price: 68,
    tag: "低强度玩耍",
    reason: "睡眠分偏低，建议用嗅闻替代高强度追逐。",
    detail: "Mock 推荐：把晚间兴奋活动降到可控强度，同时保持陪伴互动。",
    art: "toy"
  },
  {
    id: "health_skin",
    category: "health",
    title: "皮肤屏障营养补充包",
    price: 96,
    tag: "皮肤关注",
    reason: "抓挠比 7 日基线上升，作为后续观察入口。",
    detail: "Mock 推荐：仅作为展示推荐，不替代医生建议。",
    art: "health"
  },
  {
    id: "food_treat",
    category: "food",
    title: "冻干三文鱼训练零食",
    price: 49,
    tag: "奖励零食",
    reason: "用于完成腹部复查后的正向奖励。",
    detail: "Mock 推荐：控制热量，配合今天的任务奖励。",
    art: "food-alt"
  },
  {
    id: "care_raincoat",
    category: "care",
    title: "腹部防溅雨天披风",
    price: 128,
    tag: "外出护理",
    reason: "低强度散步后减少腹部沾湿。",
    detail: "Mock 推荐：与雨天披风装扮同步展示。",
    art: "care-alt"
  }
];

const outfitOptions: Array<{ id: OutfitId; label: string; meta: string; token: string; accent: string }> = [
  { id: "trail", label: "巡逻背心", meta: "低强度散步", token: "SAFE WALK", accent: "#ff8f73" },
  { id: "rain", label: "雨天披风", meta: "腹部保暖", token: "RAIN READY", accent: "#7ec8e3" },
  { id: "party", label: "生日丝巾", meta: "陪伴奖励", token: "MOOD +8", accent: "#e2a640" }
];

const outfitTabs: OutfitTab[] = ["服装", "毛发", "妆容", "配饰"];

const appearanceCatalog: Record<Exclude<OutfitTab, "服装">, Array<{ id: string; label: string; meta: string; token: string; accent: string }>> = {
  毛发: [
    { id: "fur-soft", label: "蜂蜜柔光", meta: "更暖的毛色", token: "COAT WARM", accent: "#d79554" },
    { id: "fur-cream", label: "奶油腹毛", meta: "强化白胸口", token: "CREAM COAT", accent: "#f6ddbb" },
    { id: "fur-clean", label: "清爽修毛", meta: "适合护理日", token: "GROOMED", accent: "#a8d8b9" }
  ],
  妆容: [
    { id: "makeup-bright", label: "元气腮红", meta: "心情 +5", token: "MOOD LOOK", accent: "#f4a9a8" },
    { id: "makeup-star", label: "星星贴", meta: "社区照片", token: "PHOTO READY", accent: "#e2a640" },
    { id: "makeup-calm", label: "安静眼神", meta: "夜间陪伴", token: "CALM FACE", accent: "#7ec8e3" }
  ],
  配饰: [
    { id: "acc-gps", label: "定位徽章", meta: "状态同步", token: "GPS ON", accent: "#7ec8e3" },
    { id: "acc-bell", label: "提醒铃铛", meta: "任务提醒", token: "REMINDER", accent: "#ff8f73" },
    { id: "acc-medal", label: "巡逻奖章", meta: "完成奖励", token: "TASK DONE", accent: "#e2a640" }
  ]
};

const communityPosts = [
  {
    id: "post_1",
    title: "Mochi 今天完成了低强度巡逻，回来主动喝水。",
    author: "@科技狗",
    likes: 128,
    tone: "warm",
    detail: "今天没有安排高强度奔跑，只做了 35 分钟巡逻。回来后主动喝水，腹部红点准备晚上再拍照记录。",
    tags: ["低强度散步", "饮水"]
  },
  {
    id: "post_2",
    title: "抓挠突然变多时，我会先看饮食、皮肤和最近环境变化。",
    author: "@宠物医生",
    likes: 312,
    tone: "blue",
    detail: "Mock 内容：先记录位置、持续时间、是否有红点和渗液，再看近 48 小时饮食、环境和洗护变化。",
    tags: ["健康报告", "抓挠"]
  },
  {
    id: "post_3",
    title: "雨天披风试穿记录：腹部没有再被草地打湿。",
    author: "@装备控",
    likes: 89,
    tone: "green",
    detail: "披风长度刚好盖住腹部，回来后只需要擦脚。这个帖子用于展示装扮和护理之间的联动。",
    tags: ["装扮", "护理"]
  },
  {
    id: "post_4",
    title: "分享一个嗅闻垫替代高强度奔跑的小技巧。",
    author: "@陪伴训练员",
    likes: 256,
    tone: "pink",
    detail: "把 10 分钟嗅闻任务拆成三轮，每轮结束给一句语音鼓励，适合睡眠分偏低的晚上。",
    tags: ["玩具", "训练"]
  }
];

export function App() {
  const [view, setView] = useState<AppViewId>("welcome");
  const [outfit, setOutfit] = useState<OutfitId>("trail");

  const profile = petProfiles[0];
  const packet = currentPacket(streamPackets, 21);
  const latest = latestDaily(dailySummaries);
  const state = useMemo(() => computeVirtualState(profile, dailySummaries, packet, { play: 6, clean: 4 }), [packet, profile]);
  const tasks = useMemo(() => planDailyTasks(profile, dailySummaries, state, inventory, manualObservations), [profile, state]);
  const recommendations = useMemo(() => recommendProducts(profile, tasks, inventory, productCatalog), [profile, tasks]);
  const baseline = useMemo(() => buildBaseline(dailySummaries), []);
  const anomaly = buildAnomaly(latest, baseline);
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
      selectedOutfit: outfit
    }),
    [profile, state, latest, packet, tasks, recommendations, outfit]
  );

  return (
    <div className="demo-stage">
      <main className="pet-window" aria-label="AI Pet application window">
        <section className="screen-stack">
          {view === "welcome" ? <WelcomeView profile={profile} state={state} outfit={outfit} accent={selectedOutfit.accent} onStart={() => setView("chat")} /> : null}
          {view === "market" ? <MarketView recommendations={recommendations} /> : null}
          {view === "community" ? <CommunityView /> : null}
          {view === "chat" ? <ChatHome profile={profile} state={state} outfit={outfit} accent={selectedOutfit.accent} context={agentContext} /> : null}
          {view === "status" ? <StatusDataView state={state} latest={latest} baseline={baseline} anomaly={anomaly} outfit={outfit} /> : null}
          {view === "my" ? (
            <OutfitView profile={profile} outfit={outfit} selectedOutfit={selectedOutfit} onSelect={setOutfit} />
          ) : null}
        </section>

        <nav className="bottom-nav" aria-label="application navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={view === item.id || (view === "welcome" && item.id === "chat") ? "active" : ""} onClick={() => setView(item.id)}>
                <Icon size={22} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

function WelcomeView({
  profile,
  state,
  outfit,
  accent,
  onStart
}: {
  profile: PetProfile;
  state: VirtualPetState;
  outfit: OutfitId;
  accent: string;
  onStart: () => void;
}) {
  return (
    <section className="app-screen welcome-page">
      <div className="brand-logo" aria-hidden="true">
        <PawPrint size={58} />
      </div>
      <h1>毛球伙伴</h1>
      <p>智能陪伴，温暖每一刻</p>
      <div className="welcome-pet">
        <PetFigure state={state} outfit={outfit} accent={accent} large />
      </div>
      <button className="start-button" onClick={onStart}>
        开始陪伴
      </button>
      <span className="welcome-caption">{profile.name} 已在桌面等待你的下一次互动</span>
    </section>
  );
}

function MarketView({ recommendations }: { recommendations: ReturnType<typeof recommendProducts> }) {
  const [category, setCategory] = useState<MarketCategory>("all");
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const products = category === "all" ? marketProducts : marketProducts.filter((product) => product.category === category);
  const selectedProduct = marketProducts.find((product) => product.id === selectedProductId);
  const activeCategory = marketCategories.find((item) => item.id === category) || marketCategories[0];

  return (
    <section className="app-screen scroll-screen market-screen">
      <MobileTopNav title="宠物市集" subtitle={`${activeCategory.label}推荐`} rightIcon={<ShoppingBag size={19} />} />

      <div className="category-tabs">
        {marketCategories.map((item) => (
          <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <section className="market-banner">
        <div>
          <span>Mochi 专属推荐</span>
          <h2>{category === "all" ? "今日照护推荐页" : `${activeCategory.label}精选`}</h2>
          <p>根据宠物档案、库存、抓挠记录和今日任务生成的 mock 推荐，共 {recommendations.length || marketProducts.length} 条候选。</p>
        </div>
      </section>

      <div className="product-grid">
        {products.map((product) => (
          <button key={product.id} className="product-card" onClick={() => setSelectedProductId(product.id)}>
            <div className={`product-image ${product.art}`}>
              <ShoppingBag size={44} />
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

      {selectedProduct ? (
        <section className="detail-sheet" aria-label="商品详情">
          <button className="sheet-close" onClick={() => setSelectedProductId(undefined)}>
            收起
          </button>
          <div className={`sheet-art ${selectedProduct.art}`}>
            <ShoppingBag size={42} />
          </div>
          <span>{selectedProduct.tag}</span>
          <h2>{selectedProduct.title}</h2>
          <p>{selectedProduct.detail}</p>
          <strong>¥{selectedProduct.price}</strong>
          <button className="primary-pill">加入 Mock 购物车</button>
        </section>
      ) : null}
    </section>
  );
}

function CommunityView() {
  const [query, setQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | undefined>();
  const keyword = query.trim().toLowerCase();
  const posts = keyword
    ? communityPosts.filter((post) =>
        [post.title, post.author, post.detail, ...post.tags].some((text) => text.toLowerCase().includes(keyword))
      )
    : communityPosts;
  const selectedPost = communityPosts.find((post) => post.id === selectedPostId);

  return (
    <section className="app-screen scroll-screen community-screen">
      <MobileTopNav title="宠物社区" subtitle="照护经验流" rightIcon={<UsersRound size={19} />} />

      <div className="search-box">
        <MessageCircle size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索抓挠、装扮、训练..." aria-label="搜索社区内容" />
      </div>

      <div className="waterfall">
        {posts.map((post) => (
          <button key={post.id} className={`post-card ${post.tone}`} onClick={() => setSelectedPostId(post.id)}>
            <div className="post-image">
              <PawPrint size={44} />
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

      {selectedPost ? (
        <section className="detail-sheet" aria-label="帖子详情">
          <button className="sheet-close" onClick={() => setSelectedPostId(undefined)}>
            返回社区
          </button>
          <div className={`sheet-art ${selectedPost.tone}`}>
            <PawPrint size={42} />
          </div>
          <span>{selectedPost.author}</span>
          <h2>{selectedPost.title}</h2>
          <p>{selectedPost.detail}</p>
          <div className="tag-row">
            {selectedPost.tags.map((tag) => (
              <em key={tag}>{tag}</em>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function MobileTopNav({ title, subtitle, rightIcon }: { title: string; subtitle?: string; rightIcon?: ReactNode }) {
  return (
    <header className="mobile-top-nav">
      <button className="round-button" aria-label="back">
        <ArrowLeft size={20} />
      </button>
      <div className="mobile-title">
        <strong>{title}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      <button className="round-button" aria-label="window action">
        {rightIcon || <SunMedium size={20} />}
      </button>
    </header>
  );
}

function ChatHome({
  profile,
  state,
  outfit,
  accent,
  context
}: {
  profile: PetProfile;
  state: VirtualPetState;
  outfit: OutfitId;
  accent: string;
  context: AgentContextSnapshot;
}) {
  const [messages, setMessages] = useState<AgentChatMessage[]>(() => createInitialAgentMessages(context));
  const [composerText, setComposerText] = useState("用语音回复我，然后转个圈给我看看");
  const [responseMode, setResponseMode] = useState<AgentResponseMode>("text");
  const [loading, setLoading] = useState(false);
  const [activeMotion, setActiveMotion] = useState<ExpressionCommand | undefined>();
  const threadRef = useRef<HTMLDivElement>(null);
  const persona = getPersonaForProfile(profile);
  const threadId = mainThreadIdForPet(profile);

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
    if (message.audioBase64 && message.audioContentType) {
      const audio = new Audio(`data:${message.audioContentType};base64,${message.audioBase64}`);
      void audio.play();
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message.text);
      utterance.lang = "zh-CN";
      utterance.rate = 1.04;
      utterance.pitch = 1.08;
      window.speechSynthesis.speak(utterance);
    }
  }

  async function sendMessage() {
    const input = composerText.trim();
    if (!input || loading) return;

    const createdAt = new Date().toISOString();
    const userMessage: AgentChatMessage = {
      id: `user-${createdAt}`,
      speaker: "user",
      authorName: persona.userDisplayName,
      text: input,
      createdAt,
      responseMode: "text"
    };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setComposerText("");
    setLoading(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, responseMode, threadId, history: messages, context: { ...context, mainThreadId: threadId } })
      });
      if (!response.ok) throw new Error(`agent_http_${response.status}`);
      const data = (await response.json()) as { provider?: string; answer?: string; message?: AgentChatMessage; motionCommand?: ExpressionCommand };
      const petMessage: AgentChatMessage = data.message || {
        id: `pet-${Date.now()}`,
        speaker: "pet",
        authorName: persona.displayName,
        text: data.answer || "科技狗听到了，但这次没有组织好回复。",
        createdAt: new Date().toISOString(),
        responseMode,
        provider: data.provider
      };
      setMessages((current) => [...current, petMessage]);
      if (petMessage.responseMode === "voice") playVoiceMessage(petMessage);
      if (data.motionCommand) setActiveMotion(data.motionCommand);
    } catch {
      const localTurn = createLocalAgentTurn(input, { ...context, mainThreadId: threadId }, responseMode);
      const petCreatedAt = new Date().toISOString();
      const localMessage: AgentChatMessage = {
        id: `pet-${petCreatedAt}`,
        speaker: "pet",
        authorName: persona.displayName,
        text: localTurn.answer,
        createdAt: petCreatedAt,
        responseMode,
        provider: "local-agent-fallback",
        voiceProvider: responseMode === "voice" ? "browser-speech-fallback" : undefined,
        toolCards: localTurn.toolCards
      };
      setMessages((current) => [
        ...current,
        localMessage
      ]);
      if (localMessage.responseMode === "voice") playVoiceMessage(localMessage);
      if (localTurn.motionCommand) setActiveMotion(localTurn.motionCommand);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="app-screen chat-screen">
      <MobileTopNav title={persona.groupName} subtitle={`${persona.displayName} · ${persona.userDisplayName} · 主群聊`} rightIcon={<Bell size={19} />} />

      <div className="chat-thread" ref={threadRef}>
        <div className="chat-pet-stage" aria-hidden="true">
          <div className="online-pill">
            <span />
            {threadId}
          </div>
          <PetFigure state={state} outfit={outfit} accent={accent} motionAction={activeMotion?.action} large />
        </div>

        <div className="chat-date">今天 09:30</div>
        <div className="group-members">
          <span>{persona.displayName}</span>
          <span>{persona.userDisplayName}</span>
          <span>可加入家人/医生/代遛</span>
        </div>

        <div className="message-list">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.speaker}`}>
              {message.speaker === "pet" ? <span className="message-avatar" /> : null}
              <div className="message-stack">
                <em>{message.authorName}</em>
                <button
                  className={`message-bubble ${message.responseMode === "voice" ? "voice-bubble" : ""}`}
                  onClick={() => {
                    if (message.responseMode === "voice") playVoiceMessage(message);
                  }}
                >
                  {message.responseMode === "voice" ? <Volume2 size={17} /> : null}
                  <span>{message.text}</span>
                </button>
                {message.toolCards?.length ? (
                  <div className="tool-card-row">
                    {message.toolCards.map((card) => (
                      <span key={card.id} className={`tool-card ${card.kind}`}>
                        <strong>{card.title}</strong>
                        <small>{card.detail}</small>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
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
          onChange={(event) => setComposerText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void sendMessage();
          }}
          aria-label="message"
        />
        <button aria-label="send" disabled={loading} onClick={() => void sendMessage()}>
          <Send size={18} />
        </button>
      </footer>
    </section>
  );
}

function StatusDataView({
  state,
  latest,
  baseline,
  anomaly,
  outfit
}: {
  state: VirtualPetState;
  latest: DailySummary;
  baseline: ReturnType<typeof buildBaseline>;
  anomaly: ReturnType<typeof buildAnomaly>;
  outfit: OutfitId;
}) {
  const trend = dailySummaries.slice(-7);
  const [selectedDate, setSelectedDate] = useState(latest.date);
  const [reportOpen, setReportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const selectedDaily = trend.find((item) => item.date === selectedDate) || latest;
  const selectedAnomaly = buildAnomaly(selectedDaily, baseline);
  const selectedNotes = selectedDaily.notes.join("；");

  return (
    <section className="app-screen scroll-screen status-screen">
      <MobileTopNav title="状态监测" subtitle={`${selectedDaily.date.slice(5)} 数据同页`} rightIcon={<SunMedium size={20} />} />

      <div className="action-pills">
        <button onClick={() => setHistoryOpen((value) => !value)}>
          <AlertTriangle size={16} />
          异常历史
        </button>
        <button onClick={() => setReportOpen(true)}>
          <FileText size={16} />
          健康报告
        </button>
      </div>

      <section className="status-showcase">
        <PetFigure state={state} outfit={outfit} accent="#ff8f73" />
        <div className="current-status">
          <span>当前状态</span>
          <strong>{selectedAnomaly.level}</strong>
          <p>{selectedNotes}</p>
        </div>
      </section>

      <DateSelector days={trend} selectedDate={selectedDate} onSelect={setSelectedDate} />

      {historyOpen ? (
        <section className="history-panel">
          <strong>异常历史 Mock</strong>
          <p>07:40 腹部红点观察；08:42 早餐剩余约 20g；当前记录用于演示异常链路。</p>
        </section>
      ) : null}

      <section className="anomaly-card">
        <div>
          <span className="kicker">
            <AlertTriangle size={16} />
            {selectedAnomaly.level}
          </span>
          <h2>{selectedAnomaly.title}</h2>
          <p>{selectedAnomaly.detail}</p>
        </div>
        <button>继续观察 24h</button>
      </section>

      <div className="data-card-list">
        <DataSummaryCard
          tone="sleep"
          icon={<Moon size={18} />}
          label="睡眠"
          value={String(selectedDaily.sleepScore)}
          detail={`比基线 ${selectedDaily.sleepScore - baseline.sleepScore}`}
        />
        <DataSummaryCard
          tone="activity"
          icon={<Bone size={18} />}
          label="活动"
          value={String(selectedDaily.activityIndex)}
          detail={`比基线 ${selectedDaily.activityIndex - baseline.activityIndex}`}
        />
        <DataSummaryCard
          tone="food"
          icon={<Utensils size={18} />}
          label="进食"
          value={`${selectedDaily.foodGrams}g`}
          detail={`比基线 ${selectedDaily.foodGrams - baseline.foodGrams}g`}
        />
        <DataSummaryCard
          tone="scratch"
          icon={<Waves size={18} />}
          label="抓挠"
          value={`${selectedDaily.scratchMinutes}m`}
          detail={`比基线 ${selectedDaily.scratchMinutes - baseline.scratchMinutes}m`}
        />
        <DataSummaryCard
          tone="water"
          icon={<Droplets size={18} />}
          label="饮水"
          value={`${selectedDaily.waterMl}ml`}
          detail={`比基线 ${selectedDaily.waterMl - baseline.waterMl}ml`}
        />
        <DataSummaryCard tone="location" icon={<MapPin size={18} />} label="定位" value="home" detail="电子围栏正常" />
      </div>

      <section className="trend-card">
        <div className="section-heading">
          <span>7 日趋势</span>
          <strong>activity / scratch</strong>
        </div>
        <div className="trend-bars">
          {trend.map((item) => (
            <div key={item.date} className="trend-stack">
              <span className="activity" style={{ height: `${item.activityIndex}%` }} />
              <span className="scratch" style={{ height: `${Math.min(100, item.scratchMinutes * 3)}%` }} />
              <em>{item.date.slice(5)}</em>
            </div>
          ))}
        </div>
      </section>

      {reportOpen ? (
        <section className="detail-sheet report-sheet" aria-label="健康报告详情">
          <button className="sheet-close" onClick={() => setReportOpen(false)}>
            返回状态
          </button>
          <FileText size={42} />
          <span>Mock Health Report</span>
          <h2>{selectedDaily.date} 健康报告</h2>
          <p>综合评分 {selectedDaily.healthIndex}。睡眠 {selectedDaily.sleepScore}，活动 {selectedDaily.activityIndex}，抓挠 {selectedDaily.scratchMinutes} 分钟，饮水 {selectedDaily.waterMl}ml。</p>
          <div className="report-line">
            <strong>建议</strong>
            <p>今晚继续观察腹部红点，减少高强度奔跑，完成低刺激清洁并记录照片。</p>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function OutfitView({
  profile,
  outfit,
  selectedOutfit,
  onSelect
}: {
  profile: PetProfile;
  outfit: OutfitId;
  selectedOutfit: (typeof outfitOptions)[number];
  onSelect: (value: OutfitId) => void;
}) {
  const [activeTab, setActiveTab] = useState<OutfitTab>("服装");
  const [selectedAppearance, setSelectedAppearance] = useState<Record<Exclude<OutfitTab, "服装">, string>>({
    毛发: appearanceCatalog.毛发[0].id,
    妆容: appearanceCatalog.妆容[0].id,
    配饰: appearanceCatalog.配饰[0].id
  });
  const [savedLabel, setSavedLabel] = useState("尚未保存本轮 mock 调整");
  const activeItems = activeTab === "服装" ? outfitOptions : appearanceCatalog[activeTab];
  const selectedItem =
    activeTab === "服装"
      ? selectedOutfit
      : appearanceCatalog[activeTab].find((item) => item.id === selectedAppearance[activeTab]) || appearanceCatalog[activeTab][0];

  function isSelected(item: (typeof outfitOptions)[number] | (typeof appearanceCatalog.毛发)[number]) {
    return activeTab === "服装" ? item.id === outfit : item.id === selectedAppearance[activeTab];
  }

  function selectItem(item: (typeof outfitOptions)[number] | (typeof appearanceCatalog.毛发)[number]) {
    if (activeTab === "服装") {
      onSelect(item.id as OutfitId);
      return;
    }
    setSelectedAppearance((current) => ({ ...current, [activeTab]: item.id }));
  }

  return (
    <section className="app-screen scroll-screen outfit-screen">
      <MobileTopNav title="我的装扮" subtitle="同步到桌宠外观" rightIcon={<Scissors size={19} />} />

      <header className="profile-strip">
        <div className="profile-avatar">
          <PetFigure state={{ currentAnimation: "idle" }} outfit={outfit} accent={selectedOutfit.accent} />
        </div>
        <div>
          <h1>{profile.name}</h1>
          <p>{profile.breed} · {Math.round(profile.ageMonths / 12)} 岁</p>
        </div>
      </header>

      <div className="outfit-tabs">
        {outfitTabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className="costume-grid">
        {activeItems.map((item) => (
          <button key={item.id} className={isSelected(item) ? "selected" : ""} onClick={() => selectItem(item)}>
            <span style={{ "--swatch": item.accent } as CSSProperties} />
            <strong>{item.label}</strong>
            <em>{item.meta}</em>
          </button>
        ))}
      </div>

      <div className="outfit-stage">
        <span className="outfit-token">{selectedItem.token}</span>
        <PetFigure state={{ currentAnimation: "idle" }} outfit={outfit} accent={selectedOutfit.accent} large />
      </div>

      <button className="save-button" onClick={() => setSavedLabel(`已保存：${activeTab} · ${selectedItem.label}`)}>保存装扮</button>

      <div className="sync-note">
        <Sparkles size={17} />
        <span>{profile.name} 的装扮会同步到对话背景板和桌宠外观。{savedLabel}</span>
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
      <MobileTopNav title="任务报告" subtitle="今日照护计划" rightIcon={<Trophy size={19} />} />

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

function PetFigure({
  state,
  outfit,
  accent,
  motionAction,
  large
}: {
  state: Pick<VirtualPetState, "currentAnimation">;
  outfit: OutfitId;
  accent: string;
  motionAction?: PetMotionAction;
  large?: boolean;
}) {
  const motionClass = motionAction ? `motion-${motionAction}` : "";
  return (
    <div className={`pet-portrait ${large ? "large" : ""} ${state.currentAnimation} ${motionClass} outfit-${outfit}`} style={{ "--outfit": accent } as CSSProperties}>
      <div className="pet-glow" />
      <div className="pet-shadow" />
      <div className="pet-tail" />
      <div className="pet-body">
        <span className="jacket" />
        <span className="belly" />
      </div>
      <div className="pet-head">
        <span className="pet-ear left" />
        <span className="pet-ear right" />
        <span className="pet-eye left" />
        <span className="pet-eye right" />
        <span className="pet-muzzle" />
        <span className="pet-nose" />
        <span className="bandana" />
        <span className="party-hat" />
      </div>
      <div className="pet-leg front" />
      <div className="pet-leg back" />
    </div>
  );
}

function buildBaseline(daily: DailySummary[]) {
  const recent = daily.slice(0, -1);
  return {
    foodGrams: Math.round(average(recent.map((item) => item.foodGrams))),
    activityIndex: Math.round(average(recent.map((item) => item.activityIndex))),
    sleepScore: Math.round(average(recent.map((item) => item.sleepScore))),
    scratchMinutes: Math.round(average(recent.map((item) => item.scratchMinutes))),
    waterMl: Math.round(average(recent.map((item) => item.waterMl)))
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
