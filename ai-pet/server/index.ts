import cors from "cors";
import express from "express";
import { getDiscoverySnapshot, getOpenPetsStatus, sayOpenPets } from "./openpets";

const app = express();
const port = Number(process.env.AI_PET_API_PORT || 8788);
const llmBaseUrl = process.env.LLMMELON_BASE_URL || "https://llmmelon.cloud/v1";
const llmModel = process.env.LLMMELON_MODEL || "gpt-4o-mini";

app.use(cors({ origin: ["http://127.0.0.1:5180", "http://localhost:5180"] }));
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
    desktopPet: getDiscoverySnapshot() ? "openpets-discovered" : "openpets-not-discovered"
  });
});

app.get("/api/desktop-pet/status", async (_req, res) => {
  res.json(await getOpenPetsStatus());
});

app.post("/api/desktop-pet/say", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  const reaction = String(req.body?.reaction || "success").trim();
  if (!message) {
    res.status(400).json({ ok: false, error: "message_required" });
    return;
  }

  try {
    res.json(await sayOpenPets(message, reaction));
  } catch (error) {
    res.status(503).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
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
});
