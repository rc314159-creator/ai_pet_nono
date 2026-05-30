import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  Bone,
  CalendarDays,
  ChevronRight,
  Clock3,
  Droplets,
  HeartPulse,
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
  Stethoscope,
  Trophy,
  Utensils,
  Waves
} from "lucide-react";
import { average, computeVirtualState, currentPacket, latestDaily, planDailyTasks, recommendProducts } from "./domain/engine";
import { dailySummaries, inventory, manualObservations, petProfiles, productCatalog, streamPackets } from "./domain/mockData";
import type { DailySummary, PetProfile, VirtualPetState } from "./domain/types";

type ViewId = "chat" | "data" | "outfit" | "care";
type OutfitId = "trail" | "rain" | "party";

const navItems: Array<{ id: ViewId; label: string; icon: typeof MessageCircle }> = [
  { id: "chat", label: "对话", icon: MessageCircle },
  { id: "data", label: "数据", icon: HeartPulse },
  { id: "outfit", label: "换装", icon: Shirt },
  { id: "care", label: "任务", icon: CalendarDays }
];

const outfitOptions: Array<{ id: OutfitId; label: string; meta: string; token: string; accent: string }> = [
  { id: "trail", label: "巡逻背心", meta: "适合傍晚遛狗", token: "SAFE WALK", accent: "#e16f47" },
  { id: "rain", label: "雨天披风", meta: "腹部保暖防溅", token: "RAIN READY", accent: "#3d82a4" },
  { id: "party", label: "生日丝巾", meta: "陪伴互动奖励", token: "MOOD +8", accent: "#c58b2f" }
];

const chatMessages = [
  { from: "pet", text: "我今天早餐剩了一点点，但不是不开心。我肚皮有点痒，想让你晚上看一下。" },
  { from: "user", text: "那今天还能出去玩吗？" },
  { from: "pet", text: "可以短一点，35 分钟低强度巡逻就好。回来后帮我擦一下腹部红点。" }
];

export function App() {
  const [view, setView] = useState<ViewId>("chat");
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

  return (
    <div className="demo-stage">
      <div className="desktop-pet-anchor" aria-label="desktop pet preview">
        <div className="mini-pet">
          <span className="mini-ear left" />
          <span className="mini-ear right" />
          <span className="mini-face" />
        </div>
        <div className="desktop-bubble">Mochi 有一个新提醒</div>
      </div>

      <main className="pet-window" aria-label="AI Pet application window">
        <WindowTopBar profile={profile} state={state} />
        <section className="window-body">
          <aside className="pet-side">
            <PetIdentity profile={profile} state={state} outfit={outfit} accent={selectedOutfit.accent} />
            <StatusStack state={state} latest={latest} anomaly={anomaly} />
          </aside>

          <section className="content-side">
            {view === "chat" ? <ChatHome profile={profile} latest={latest} anomaly={anomaly} /> : null}
            {view === "data" ? <DataView latest={latest} baseline={baseline} anomaly={anomaly} /> : null}
            {view === "outfit" ? (
              <OutfitView profile={profile} outfit={outfit} selectedOutfit={selectedOutfit} onSelect={setOutfit} />
            ) : null}
            {view === "care" ? <CareView tasks={tasks} recommendations={recommendations} /> : null}
          </section>
        </section>
        <nav className="bottom-nav" aria-label="application navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>
    </div>
  );
}

function WindowTopBar({ profile, state }: { profile: PetProfile; state: VirtualPetState }) {
  return (
    <header className="window-topbar">
      <div className="window-controls" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="window-title">
        <PawPrint size={18} />
        <div>
          <strong>{profile.name}</strong>
          <span>{state.currentAnimation === "alert" ? "需要关注" : "陪伴在线"}</span>
        </div>
      </div>
      <button className="ghost-icon" aria-label="notifications">
        <Bell size={18} />
      </button>
    </header>
  );
}

function PetIdentity({
  profile,
  state,
  outfit,
  accent
}: {
  profile: PetProfile;
  state: VirtualPetState;
  outfit: OutfitId;
  accent: string;
}) {
  return (
    <section className="identity-card">
      <div className="identity-copy">
        <span className="chip hot">真实宠物分身</span>
        <h1>{profile.name}</h1>
        <p>{profile.breed} · {profile.ageMonths} 个月 · {profile.weightKg}kg</p>
      </div>

      <div className={`pet-portrait ${state.currentAnimation} outfit-${outfit}`} style={{ "--outfit": accent } as CSSProperties}>
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

      <div className="pet-caption">
        <Sparkles size={16} />
        <span>{profile.avatar.tagline}</span>
      </div>
    </section>
  );
}

function StatusStack({
  state,
  latest,
  anomaly
}: {
  state: VirtualPetState;
  latest: DailySummary;
  anomaly: ReturnType<typeof buildAnomaly>;
}) {
  return (
    <section className="status-card">
      <div className="section-heading">
        <span>今日状态</span>
        <strong>{anomaly.level}</strong>
      </div>
      <div className="ring-row">
        <RingMetric label="心情" value={state.mood} />
        <RingMetric label="精力" value={state.energy} />
        <RingMetric label="清洁" value={state.cleanliness} />
      </div>
      <div className="micro-list">
        <div><Utensils size={15} /> 摄食 {latest.foodGrams}g</div>
        <div><Waves size={15} /> 抓挠 {latest.scratchMinutes}min</div>
        <div><Moon size={15} /> 睡眠 {latest.sleepScore}</div>
      </div>
    </section>
  );
}

function RingMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="ring-metric" style={{ "--value": `${value * 3.6}deg` } as CSSProperties}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ChatHome({ profile, latest, anomaly }: { profile: PetProfile; latest: DailySummary; anomaly: ReturnType<typeof buildAnomaly> }) {
  return (
    <div className="view-panel chat-view">
      <div className="view-heading">
        <div>
          <span className="chip">主页</span>
          <h2>陪伴对话</h2>
        </div>
        <button className="round-action"><Mic2 size={17} /> 语音</button>
      </div>

      <div className="chat-layout">
        <div className="chat-thread">
          {chatMessages.map((message, index) => (
            <div key={`${message.from}-${index}`} className={`message ${message.from}`}>
              <span>{message.text}</span>
            </div>
          ))}
        </div>
        <aside className="context-stack">
          <article className="context-card alert">
            <AlertTriangle size={18} />
            <div>
              <strong>{anomaly.title}</strong>
              <p>{anomaly.detail}</p>
            </div>
          </article>
          <article className="context-card">
            <Stethoscope size={18} />
            <div>
              <strong>记忆引用</strong>
              <p>{profile.name} 鸡肉过敏，今天早餐剩粮 {Math.max(0, profile.diet.dailyGrams - latest.foodGrams)}g。</p>
            </div>
          </article>
        </aside>
      </div>

      <div className="composer">
        <button><Sparkles size={16} /> 今天怎么安排？</button>
        <div className="input-shell">
          <span>帮我解释今天的异常</span>
          <Send size={18} />
        </div>
      </div>
    </div>
  );
}

function DataView({
  latest,
  baseline,
  anomaly
}: {
  latest: DailySummary;
  baseline: ReturnType<typeof buildBaseline>;
  anomaly: ReturnType<typeof buildAnomaly>;
}) {
  const trend = dailySummaries.slice(-7);
  return (
    <div className="view-panel data-view">
      <div className="view-heading">
        <div>
          <span className="chip warn">异常报告</span>
          <h2>数据与异常</h2>
        </div>
        <span className="timestamp">今天 09:30</span>
      </div>

      <section className="anomaly-report">
        <div>
          <AlertTriangle size={22} />
          <span>{anomaly.level}</span>
        </div>
        <h3>{anomaly.title}</h3>
        <p>{anomaly.detail}</p>
        <div className="report-actions">
          <button>继续观察 24h</button>
          <button>打开问诊入口</button>
        </div>
      </section>

      <div className="metric-board">
        <MetricCard icon={<Utensils size={18} />} label="进食量" value={`${latest.foodGrams}g`} delta={`${latest.foodGrams - baseline.foodGrams}g`} tone="warn" />
        <MetricCard icon={<Bone size={18} />} label="活动指数" value={latest.activityIndex} delta={`${latest.activityIndex - baseline.activityIndex}`} tone="bad" />
        <MetricCard icon={<Moon size={18} />} label="睡眠分" value={latest.sleepScore} delta={`${latest.sleepScore - baseline.sleepScore}`} tone="warn" />
        <MetricCard icon={<MapPin size={18} />} label="定位" value="home" delta="围栏正常" tone="ok" />
        <MetricCard icon={<Waves size={18} />} label="抓挠" value={`${latest.scratchMinutes}m`} delta={`+${latest.scratchMinutes - baseline.scratchMinutes}m`} tone="bad" />
        <MetricCard icon={<Droplets size={18} />} label="饮水" value={`${latest.waterMl}ml`} delta={`${latest.waterMl - baseline.waterMl}ml`} tone="warn" />
      </div>

      <div className="trend-card">
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
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  delta,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  delta: string;
  tone: "ok" | "warn" | "bad";
}) {
  return (
    <article className={`metric-card ${tone}`}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{delta}</em>
    </article>
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
  return (
    <div className="view-panel outfit-view">
      <div className="view-heading">
        <div>
          <span className="chip">互动</span>
          <h2>换装试衣间</h2>
        </div>
        <button className="round-action"><Scissors size={17} /> 保存</button>
      </div>

      <div className="outfit-layout">
        <div className="outfit-stage">
          <span className="outfit-token">{selectedOutfit.token}</span>
          <div className={`pet-portrait large outfit-${outfit}`} style={{ "--outfit": selectedOutfit.accent } as CSSProperties}>
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
        </div>

        <div className="outfit-list">
          {outfitOptions.map((item) => (
            <button key={item.id} className={outfit === item.id ? "selected" : ""} onClick={() => onSelect(item.id)}>
              <span style={{ background: item.accent }} />
              <strong>{item.label}</strong>
              <em>{item.meta}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="sync-note">
        <Sparkles size={17} />
        <span>{profile.name} 的装扮会同步到对话主页和桌宠外观。</span>
      </div>
    </div>
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
    <div className="view-panel care-view">
      <div className="view-heading">
        <div>
          <span className="chip">计划</span>
          <h2>任务与报告</h2>
        </div>
        <span className="timestamp">mock week 22</span>
      </div>

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

      <div className="commerce-strip">
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
      </div>

      <div className="report-card">
        <Trophy size={18} />
        <div>
          <strong>周报摘要</strong>
          <p>活动低于基线，抓挠上升；建议减少高强度奔跑，今晚完成腹部复查。</p>
        </div>
      </div>
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
