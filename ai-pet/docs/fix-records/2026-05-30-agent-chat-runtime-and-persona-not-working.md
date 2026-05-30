---
title: 2026-05-30 对话页 Agent 未正常对话与角色提示词不足问题记录
description: 记录应用窗口对话页 Agent 疑似未成功集成、API 配置待验证、回复不像宠物角色的问题、证据、根因和修复计划。
status: 已修复
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
domain_taxa:
  - agent-runtime
  - app-window
  - prompt-design
related:
  - ../product/product-spec-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../modules/agent-chat-2026-05-30.md
---

# 2026-05-30 对话页 Agent 未正常对话与角色提示词不足问题记录

## 事实时间线

- 2026-05-30，用户反馈应用窗口对话页的 Agent 似乎没有成功集成，怀疑 API 未配置或不能正常对话。
- 用户同时反馈当前系统提示词可能有问题，回复“像机器人一样”，不符合宠物猫娘或狗狗陪伴角色应有的语气。
- 现有产品规格和模块 spec 已要求对话页是单宠物唯一长期主群聊，主 Agent 使用 OpenAI Agents SDK，底层优先 llmmelon OpenAI-compatible Chat Completions，宠物可见身份必须复用 `PetProfile`。
- 本轮检查 `.env.local`：llmmelon 文字模型网关配置存在，Qwen TTS 相关 key 当前缺失。
- 本轮直接请求 `GET /api/agent/status`：返回 `provider=openai-agents-sdk:llmmelon`、`model=gpt-4o-mini`、`configured=true`，说明文字 Agent API 已配置。
- 本轮直接请求 `POST /api/agent/chat`：返回 `provider=openai-agents-sdk:llmmelon`，且“转个圈”请求产生 `motionCommand.action=spin`。

## 证据

- 用户原始反馈：对话页“没有办法正常对话”，并要求检查 API 配置、Agent 是否可正常对话、系统提示词是否角色化不足。
- `ai-pet/docs/product/product-spec-2026-05-30.md` 已规定对话页 Agent 使用 OpenAI Agents SDK，Demo 的 Agent 模型供应商优先使用 llmmelon。
- `ai-pet/docs/modules/agent-chat-2026-05-30.md` 已规定群聊身份、主 thread、文字/语音输出模式和工具边界。
- 代码检查发现 `src/App.tsx` 对话发送仍使用 `fetch("/api/agent/chat")`。在 Vite dev server 下该路径可由代理转发；但在 `AI_PET_LOAD_DIST=1` 的 Electron `file://dist/index.html` 模式下，它不是 `127.0.0.1:8788`，会导致前端进入本地 fallback。
- Browser 验证开发渲染入口 `http://127.0.0.1:5181/?view=chat`：发送“你是谁？像我的小狗一样陪我说话，别像机器人。然后转个圈给我看看。”后，页面显示宠物化回复、动作卡片“桌宠动作 / 转个圈”，console warn/error 为空。
- Browser 安全策略拒绝直接访问 `file://dist/index.html`，因此本轮没有用 Browser 打开 file URL；file 模式修复通过 `src/api.ts` 和构建产物中 `window.location.protocol === "file:"` 时切换到 `http://127.0.0.1:8788` 的逻辑确认。
- 联网调研参考：Character.AI 的 Definition 文档说明角色定义常用示例对话并应把重要设定放前面；Setting a Scene 文档强调用场景让用户发言自然接在角色上下文后；角色提示词资料普遍强调身份锚定、动作/口癖、场景和禁止泛助手腔。

## 根因

1. Electron 构建产物运行时使用 `file://`，前端相对 API 路径 `/api/agent/chat` 无法稳定指向本地 Express API，导致应用窗口容易静默退回前端本地 fallback。
2. 系统提示词和初始消息保留了“Agent、工具、主 thread、同步”等工程叙事，角色表达偏说明书，不像真实宠物陪伴。
3. 模型有时会在文字中描述“转圈”，但没有调用 `request_pet_motion` 工具，导致桌宠动作链路不可靠。
4. 语音触发词过宽，把“陪我说话”误判为语音需求，页面出现 `browser-speech-fallback` 这类技术词，进一步削弱宠物角色感。

## 修复内容

1. 新增 `src/api.ts`，统一前端 API URL；当页面运行在 `file://` 下时改用 `http://127.0.0.1:8788`。
2. 将 `src/App.tsx`、`AdvisorChat`、`DesktopPetBridge` 的相对 `/api` 请求切到 `apiUrl()`。
3. 更新 `.env.example`，新增 `VITE_AI_PET_API_BASE_URL=http://127.0.0.1:8788`。
4. 重写 `src/domain/agent.ts` 的 persona、初始消息、系统提示词和本地 fallback 文案：避免泛助手腔和工程词，增加宠物身份、动作、口癖、回复长度和狗/猫风格约束。
5. 在 `server/agent.ts` 增加动作工具兜底：模型遗漏明显动作工具调用时，由 Agent 后端补齐 `request_pet_motion` 对应的 motion command。
6. 收紧语音触发词，只有“语音、声音、出声、读出来、念出来、voice、tts”等明确请求才走语音工具。
7. 页面工具卡片将动作 `spin` 等内部 action 显示为“转个圈”等用户可读文本，避免泄露技术味文案。

## 验证结果

- `npm run typecheck` 通过。
- `npm run build` 通过。
- `GET /api/agent/status` 返回 `openai-agents-sdk:llmmelon`、`gpt-4o-mini`、`configured=true`。
- `POST /api/agent/chat` 输入“你是谁？像我的小狗一样陪我说话，别像机器人。然后转个圈给我看看。”返回：
  - `provider=openai-agents-sdk:llmmelon`
  - `model=gpt-4o-mini`
  - `responseMode=text`
  - `toolCards=[{ kind: "motion", title: "桌宠动作", detail: "spin" }]`
  - `motionCommand.action=spin`
  - 无语音 fallback 卡片。
- Browser/Playwright 开发渲染入口验证通过：页面显示“旺财家庭群”、宠物化回复和“桌宠动作 / 转个圈”，console warn/error 为空。

## 当前限制

- llmmelon 文字 Agent 已配置并可正常对话。
- Qwen TTS 当前未配置 key，`/api/agent/status` 返回 `tts=browser-speech-fallback`、`ttsConfigured=false`。文字对话不受影响；语音模式仍只能用浏览器语音兜底。
- Browser 安全策略禁止访问 `file://`，因此 file 模式未做 Browser 实机交互验证；修复依赖构建产物中的 `apiUrl()` 分支和后续 Electron 应用窗口验证。

## 调研引用

- [Character.AI Definition](https://book.character.ai/character-book/character-attributes/definition)：角色定义可包含任意文本，常见用法是加入示例对话，并建议把重要定义放前面。
- [Character.AI Setting a Scene](https://book.character.ai/character-book/advanced-creation/setting-a-scene)：用隐藏场景和过渡语境让用户发言自然接入角色对话。
- [猫娘角色提示词调研](https://www.1391314.com/a/deepseek-mao-niang-zhou-yu.html) 与 [结构化猫娘提示词示例](https://www.php.cn/faq/2048653.html)：角色提示词常见结构包含身份锚定、口癖/动作、场景锚点、行为规则和避免提及 AI/模型。
