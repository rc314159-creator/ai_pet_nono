import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, Brain, Clock3, Database, FileText, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { apiUrl } from "../api";

type KnowledgeBaseSectionId = "profile" | "care" | "memory" | "events";

type KnowledgeBaseEntry = {
  id: string;
  sectionId: KnowledgeBaseSectionId;
  title: string;
  detail: string;
  source: string;
  updatedAt: string;
  tags: string[];
  importance: "high" | "medium" | "low";
};

type KnowledgeBaseSection = {
  id: KnowledgeBaseSectionId;
  title: string;
  summary: string;
  entries: KnowledgeBaseEntry[];
};

type KnowledgeBaseSnapshot = {
  version: 1;
  revision: number;
  updatedAt: string;
  sections: KnowledgeBaseSection[];
};

const sectionIcons: Record<KnowledgeBaseSectionId, typeof Database> = {
  profile: FileText,
  care: Activity,
  memory: Brain,
  events: Clock3
};

function formatTime(value: string) {
  if (!value) return "未同步";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未同步";
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function importanceLabel(value: KnowledgeBaseEntry["importance"]) {
  if (value === "high") return "重点";
  if (value === "medium") return "同步";
  return "记录";
}

export function KnowledgeBaseView({ onBack }: { onBack: () => void }) {
  const [snapshot, setSnapshot] = useState<KnowledgeBaseSnapshot | undefined>();
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");

  async function refreshSnapshot() {
    try {
      const response = await fetch(apiUrl("/api/knowledge-base"), { cache: "no-store" });
      if (!response.ok) throw new Error(`knowledge_base_${response.status}`);
      setSnapshot((await response.json()) as KnowledgeBaseSnapshot);
      setError("");
    } catch {
      setError("知识库暂时无法同步");
    }
  }

  useEffect(() => {
    void refreshSnapshot();

    const source = new EventSource(apiUrl("/api/knowledge-base/stream"));
    source.addEventListener("snapshot", (event) => {
      const message = event as MessageEvent<string>;
      setSnapshot(JSON.parse(message.data) as KnowledgeBaseSnapshot);
      setLive(true);
      setError("");
    });
    source.onerror = () => {
      setLive(false);
    };

    return () => source.close();
  }, []);

  const totalEntries = useMemo(() => snapshot?.sections.reduce((sum, section) => sum + section.entries.length, 0) || 0, [snapshot]);

  return (
    <section className="app-screen scroll-screen knowledge-screen">
      <div className="my-subpage-header">
        <button className="my-back-button" onClick={onBack} aria-label="返回我的">
          <ArrowLeft size={18} />
        </button>
        <header className="mobile-top-nav">
          <div className="mobile-title">
            <strong>宠物知识库</strong>
            <span>实时同步 · {totalEntries} 条事实</span>
          </div>
        </header>
      </div>

      <section className="knowledge-live-card" aria-label="知识库同步状态">
        <div>
          <span className={live ? "live-dot active" : "live-dot"} />
          <strong>{live ? "实时更新中" : "等待同步"}</strong>
          <p>最近更新 {formatTime(snapshot?.updatedAt || "")} · 修订 {snapshot?.revision ?? "-"}</p>
        </div>
        <button onClick={() => void refreshSnapshot()} aria-label="刷新知识库">
          <RefreshCw size={17} />
        </button>
        {live ? <Wifi size={18} /> : <WifiOff size={18} />}
      </section>

      {error ? <p className="knowledge-error">{error}</p> : null}

      <div className="knowledge-section-list">
        {(snapshot?.sections || []).map((section) => {
          const Icon = sectionIcons[section.id];
          return (
            <section key={section.id} className="knowledge-section">
              <div className="knowledge-section-head">
                <span>
                  <Icon size={17} />
                  {section.title}
                </span>
                <em>{section.entries.length}</em>
              </div>
              <p>{section.summary}</p>

              <div className="knowledge-entry-list">
                {section.entries.length ? (
                  section.entries.map((entry) => (
                    <article key={entry.id} className={`knowledge-entry ${entry.importance}`}>
                      <div>
                        <strong>{entry.title}</strong>
                        <span>{importanceLabel(entry.importance)} · {formatTime(entry.updatedAt)}</span>
                      </div>
                      <p>{entry.detail}</p>
                      <footer>
                        <em>{entry.source}</em>
                        <span>{entry.tags.slice(0, 3).join(" / ")}</span>
                      </footer>
                    </article>
                  ))
                ) : (
                  <div className="knowledge-empty">暂无记录</div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
