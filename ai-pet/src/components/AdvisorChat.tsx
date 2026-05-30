import { Bot, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";

type Props = {
  context: unknown;
};

const suggestions = [
  "今天要不要给 Mochi 洗澡？",
  "腹部红点和抓挠增加怎么办？",
  "主粮够不够？推荐什么商品？",
  "今天适合遛多久？"
];

export function AdvisorChat({ context }: Props) {
  const [question, setQuestion] = useState(suggestions[0]);
  const [answer, setAnswer] = useState("选择一个问题或直接输入，AI 会基于宠物档案、mock 设备数据、任务和库存回答。");
  const [provider, setProvider] = useState("ready");
  const [loading, setLoading] = useState(false);

  async function ask(nextQuestion = question) {
    setQuestion(nextQuestion);
    setLoading(true);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: nextQuestion, context })
      });
      const data = await response.json() as { provider?: string; answer?: string; warning?: string };
      setProvider(data.warning ? `${data.provider} · ${data.warning}` : data.provider || "unknown");
      setAnswer(data.answer || "没有返回内容。");
    } catch (error) {
      setProvider("client-error");
      setAnswer(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel advisor-panel">
      <div className="panel-title">
        <div>
          <p className="eyebrow">AI care advisor</p>
          <h3>宠物知识问答</h3>
        </div>
        <span className="provider-pill"><Bot size={16} /> {provider}</span>
      </div>

      <div className="suggestion-row">
        {suggestions.map((item) => (
          <button key={item} onClick={() => void ask(item)}>{item}</button>
        ))}
      </div>

      <div className="chat-box">
        <div className="answer">
          <ShieldCheck size={18} />
          <p>{answer}</p>
        </div>
        <div className="input-row">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => {
            if (event.key === "Enter") void ask();
          }} />
          <button disabled={loading} onClick={() => void ask()}>
            <Send size={17} />
            {loading ? "思考中" : "询问"}
          </button>
        </div>
      </div>
    </section>
  );
}
