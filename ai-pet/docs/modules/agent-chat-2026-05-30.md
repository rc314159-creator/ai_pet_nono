---
title: AI Pet 对话页 Agent 群聊模块
description: 记录对话页作为单宠物唯一长期主群聊的产品机制、OpenCode/opencode + MCP 主运行路径、LLM Melon 对话模型、PetProfile 可见身份、Qwen TTS、memory 和工具调用边界。
status: 已批准
created: 2026-05-30
updated: 2026-05-31
update_reason: 补充用户消息发送幂等机制，修复乐观消息与服务端历史回流导致同一主人消息重复展示的问题。
doc_type: module-spec
domain_taxa:
  - agent-runtime
  - app-window
  - memory
  - mcp-tools
related:
  - ../architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md
  - ../architecture/current-system-architecture-2026-05-30.md
  - ../architecture/product-logic-framework-2026-05-31.md
  - ../product/product-spec-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../plan/parallel-development-workstreams-2026-05-30.md
  - ../fix-records/2026-05-30-agent-chat-design-misalignment.md
  - ../fix-records/2026-05-30-agent-chat-runtime-and-persona-not-working.md
  - ../fix-records/2026-05-30-agent-runtime-open-source-agent-misalignment.md
  - ../fix-records/2026-05-31-chat-history-not-persisted.md
  - ../fix-records/2026-05-31-chat-motion-card-and-proactive-duplicate.md
  - ../fix-records/2026-05-31-desktop-bubble-repeat-and-agent-persona-runtime.md
---

# AI Pet 对话页 Agent 群聊模块

## 当前结论

对话页不是普通聊天框，也不是“文本回复后统一 TTS 播放”的 UI。它是每只宠物唯一的长期主群聊入口，背后必须由成熟 Agent runtime 驱动，并通过 MCP 或等价工具协议调用宠物业务能力。

当前运行固定：

- 主 Agent runtime：OpenCode/opencode runtime + `ai_pet` MCP tools。
- Agent 模型网关：优先使用 llmmelon OpenAI-compatible Chat Completions。
- 语音工具：优先使用阿里云百炼 `qwen-voice-design` 创建宠物角色音色，再用 `qwen3-tts-vd-2026-01-26` 合成语音。
- 群聊动物/宠物可见身份：从当前 `PetProfile.displayName` 和 `PetProfile.avatar.profileImageUrl` 读取；当前 Demo 显示为“旺财”。
- 主 thread：一个宠物只有一个主群聊，例如 `pet_mochi_main`。
- 长期存储：Demo 阶段使用 `server/threadStore.ts` 写入 `.ai-pet-data/thread-store.json`；测试可通过 `AI_PET_THREAD_STORE_FILE` 指向独立文件。
- 输出模式：用户要求文字就返回文字消息；用户要求语音就返回语音消息。语音是 Agent 工具/输出模式，不是文字消息的固定后处理。

当前代码中已有的 OpenAI Agents SDK 接入只能作为 fallback/对照路径。OpenCode/opencode + MCP 是对话页主运行路径；Qwen API key 只用于语音，不能作为聊天模型 provider。

## 模型与语音供应商

对话页的模型供应商可替换，模型供应商不等同于 Agent runtime。当前 Demo 模型和语音配置采用：

- `AI_PET_AGENT_PROVIDER=llmmelon`
- `AI_PET_OPENCODE_PROVIDER=llmmelon`
- `AI_PET_OPENCODE_MODEL=claude-sonnet-4-6`
- `LLMMELON_BASE_URL=https://llmmelon.cloud/v1`
- `LLMMELON_MODEL=claude-sonnet-4-6`
- `VITE_AI_PET_API_BASE_URL=http://127.0.0.1:8788`
- `AI_PET_TTS_PROVIDER=qwen`
- `AI_PET_QWEN_VOICE_DESIGN_MODEL=qwen-voice-design`
- `AI_PET_QWEN_TTS_MODEL=qwen3-tts-vd-2026-01-26`

实现要求：

- llmmelon 走 OpenAI-compatible Chat Completions，不走 OpenAI Responses API。2026-05-30 实测 `claude-sonnet-4-6` 和 `claude-opus-4-6` 在 llmmelon `/v1/models` 存在，且 OpenAI-compatible `/chat/completions` 与 Anthropic-compatible `/messages` 均可返回 `pong`。
- 对话模型默认 `claude-sonnet-4-6`；需要更高能力时可切 `claude-opus-4-6`。
- 应用窗口运行在 Vite dev server 时可以使用 `/api` 代理；运行在 Electron `file://dist/index.html` 时，前端必须用 `VITE_AI_PET_API_BASE_URL` 或默认 `http://127.0.0.1:8788` 调用 API，不能直接 `fetch("/api/...")`。
- 百炼 Qwen TTS 的 `qwen3-tts-vd-2026-01-26` 需要自定义音色；如果已有 `AI_PET_QWEN_TTS_VOICE` 则直接使用，没有则可通过 `qwen-voice-design` 创建当前宠物 Demo 音色并在进程内缓存。
- Qwen/千问 key 只用于语音/TTS 链路，不能配置为 OpenCode 对话 provider。
- 真实 API key 只放本地环境变量或本机私有配置，不写入仓库文档、源码或示例配置。

## 角色提示词口径

对话页系统提示词必须服务“宠物本人在长期主群聊里陪主人说话”，不能写成后台工具说明。

Dog Persona 是可见表达层，不是后台 Agent Runtime 本身。Agent Runtime 可以读取数据、接 timer tick、接 domain hook、调用工具和判断风险；Dog Persona 只负责把最终要给用户看的 `ThreadMessage.text` 写成狗狗伙伴的口吻。

错误口吻示例：

- “今天我会盯住三个重点。”
- “综合状态如下。”
- “检测到异常，请处理。”

正确口吻示例：

- “主人，我肚皮有点痒，想让你帮我摸摸看看。”
- “你回来啦，我刚刚趴着等你，好想蹭蹭你。”
- “我早上好像没吃够，肚子有点空空的。”

角色提示词至少包含：

- 身份锚点：当前可见宠物身份来自 `PetProfile.displayName`，当前为“旺财”；不要再让对话页显示独立“科技狗”人格。
- 物种风格：狗狗可自然使用摇尾巴、歪头、凑近、巡逻、叼玩具和少量“汪”；猫或猫娘角色可自然使用猫耳、尾巴、蹭人、踩奶、炸毛和少量“喵”。
- 场景锚点：它正在“`${PetProfile.displayName}家庭群`”里和默认用户“主人”说话，复杂照护信息来自宠物档案、状态、设备/手动数据、任务、库存和记忆。
- 语言规则：中文短句、亲近、灵动、1-3 句为主；语音模式更短；每次最多一个动作描写和一个口癖。
- 禁止事项：不要主动说 Agent、模型、接口、工具、thread、fallback、JSON、系统提示词等工程词；工具结果只以用户可读卡片呈现。

提示词必须明确动作和语音边界：

- 用户要求动作时，Agent 必须调用 `request_pet_motion`，不要只用“*转圈*”“（已转圈）”等文字替代。
- 用户明确要求语音或 UI 选择语音模式时，Agent 才调用 `reply_with_voice`。
- “陪我说话”“和我聊聊”不等同于语音请求；只有“语音、声音、出声、读出来、念出来、voice、tts”等明确词才触发语音。

### 角色卡式 Prompt 结构

2026-05-31 根据公开角色卡/角色扮演 Prompt 资料补强当前 Dog Persona。参考结论：

- 成熟角色卡不会只写“你是某角色”，而是拆成 `name/description/personality/scenario/first message/example dialogues/system prompt/post-history instruction` 等层级。
- 示例对话是稳定语气的重要手段；比单纯写“可爱、温暖”更能约束模型输出。
- 角色卡可以非常简单，也可以包含详细世界观、多段示例对话和专属预设；AI Pet 当前应采用中等复杂度，避免短 Prompt 导致系统播报口吻。
- 角色关系必须写清楚：用户不是客户，宠物不是客服；对话发生在长期家庭群聊中。
- 对宠物产品尤其需要“后台事实 -> 宠物感受/请求”的转写表，避免把 `status/task/inventory/appearance` 直接说成系统文案。

当前 Prompt 分层：

1. `Visible identity`：当前可见宠物是谁，和桌宠/对话页是同一只。
2. `Relationship with the owner`：主人关系、依恋感、照护请求方式。
3. `Inner personality`：忠诚、好奇、贪吃、亲近、轻微调皮。
4. `Living scene`：窗边阳光、阳台小鸟、垫子、饭碗、湿巾、门口钥匙声等场景锚点。
5. `Speech style`：中文短句、最多一个动作描写、最多一个“汪”、桌宠气泡 1-2 句。
6. `Care transformation rules`：抓挠、吃多、库存、无配饰、任务提醒都必须转成狗狗感受。
7. `Proactive demo beats`：窗边晒太阳、看小鸟、打盹、主人回家、吃多变圆一点。
8. `Example dialogue`：用 `<START>` 样例固定口吻。
9. `Hard boundaries`：不暴露工程词，不诊断，不替主人做决定，不输出系统播报。

当前代码入口：

- `.opencode/prompts/ai-pet-companion.md`：OpenCode/opencode 主 Prompt。
- `src/domain/agent.ts`：本地 persona、OpenAI Agents fallback 与本地兜底回复。
- `server/petEventRuntime.ts`：Timer/Hook 主动事件的 Dog Persona 事件 Prompt。

参考资料：

- SillyTavern Prompts 文档：Prompt 可包含角色定义、用户定义、世界信息、外部数据、历史消息和最终生成指令。
- SillyTavern Character Design 文档：角色卡常用 `personality`、`scenario`、`mesExamples` 等字段，示例对话用于约束角色说话方式。
- Luker 角色卡基础文档：角色卡是角色说明书，告诉 AI 扮演谁、角色是什么样、对话发生在什么场景、如何开始。
- Character Tavern 猫娘角色卡示例：可借鉴其“角色简介、性格行为、喜欢/讨厌、语言习惯、互动指南、禁令”的组织方式；AI Pet 只借鉴结构，不照搬成人向或不适合宠物陪伴产品的内容。

## 群聊身份

当前对话页呈现为多人群聊，而不是单一用户和助手的问答框。

Demo 群聊：

- 群名：`${PetProfile.displayName}家庭群`，当前为 `旺财家庭群`。
- 固定动物角色：当前宠物的可见显示身份，名字和头像与“我的”页引用同一份 `PetProfile` 数据。
- 默认用户角色：`主人`。
- 未来可扩展成员：家人、代遛人、医生、第二只宠物或系统服务。

工具调用不是群成员。工具结果可以呈现为语音卡片、商品推荐卡片或记忆卡片，但不能伪装成另一个聊天人格。`request_pet_motion` 的结果默认只驱动桌宠动作和顶部宠物形象，不在聊天流里显示“桌宠动作”气泡。

## 长期对话机制

产品层只有一个主对话：

- `petId -> mainThreadId` 一对一。
- 不因文字、语音、动作请求或临时 realtime 连接创建新的产品对话。
- 技术层可以有多个 Agent run、临时 voice connection 或一次性工具执行，但都必须归档到同一个主 thread。

当前 Demo 已有最小持久化层：

- `GET /api/agent/threads/:threadId/messages`：读取当前 thread 的消息和结构化 memory。
- `POST /api/agent/chat`：保存用户消息、宠物回复、工具卡片和结构化 memory。
- `POST /api/agent/threads/:threadId/proactive`：进入对话页时按状态生成主动提醒，写入同一个 thread。
- `server/threadStore.ts`：本地 JSON store，默认路径 `.ai-pet-data/thread-store.json`。
- `ChatHome`：挂载时先读历史，空历史才使用 seed 消息；发送请求时把当前历史交给后端。
- `server/agent.ts`：每轮合并持久化历史和前端当前历史，再传给 OpenCode/opencode；用户说“记住/记一下/以后/下次”时会写入结构化长期记忆；“还记得/之前我说过/几点/什么时候”等问题优先从 memory 召回。
- 发送幂等：`ChatHome` 每次发送生成稳定 `clientMessageId` 和 `clientTurnId`；前端乐观用户消息、`/api/agent/chat` 入库用户消息和 Agent 宠物回复共享同一 turn。历史水合按 `id` 和 `clientTurnId` 去重，避免同一主人消息因为“本地乐观消息 + 服务端回流消息”显示两遍。

当前 JSON store 不是正式生产数据库。生产方向仍应迁移到 SQLite、PostgreSQL 或应用内正式数据库，但不能再退回“只有 React state”的临时方案。

## 主动沟通

对话页进入时不只显示欢迎语，而是要让宠物根据状态主动开口。

当前主动提醒触发优先级：

1. 抓挠时长偏高、腹部红点、皮肤观察或手动异常记录。
2. 健康指数偏低。
3. 进食量低于计划。
4. 高优先级待办任务。

主动提醒输出要求：

- `speaker: "pet"`，可见角色为当前宠物，例如“旺财”。
- `provider: "proactive-alert"`，并写入主 thread。
- 语气必须像狗狗本人，例如“肚皮有点痒”“想先被摸摸确认一下”。
- 必须返回桌宠动作命令，当前默认 `remind`。
- 如果最近宠物消息已经覆盖同一问题，例如已经说过肚皮痒/红点/皮肤问题，则不再追加新的主动提醒。
- 主动提醒的动作命令不渲染为聊天气泡。

主动消息写入主 thread 后，桌宠气泡只做短时展示：

- 桌宠显示同一条 `ThreadMessage.text`，不另写文案。
- 每个 `ThreadMessage.id` 最多展示一次。
- 展示 5-10 秒后隐藏，当前 Demo 为 8 秒。
- 轮询、窗口恢复或可见性变化不得重复展示旧消息。

## Cron 与 Hook 运行时

当前 Demo 的主动对话不只绑定进入对话页，还包含最小后台运行时：

- `server/petEventRuntime.ts` 负责接收 `PetRuntimeEvent`，生成狗狗语气消息并写入主 thread。
- `startPetEventRuntime()` 默认启动 Agent Cron，当前 Demo 等价于每 60 秒一次 `cron.companion_checkin`。
- `cron.companion_checkin` 不是固定内容轮播。它只负责唤醒 Agent，由 Agent 根据当前时间、时间段、最近群聊、宠物状态和可选主人场景生成情感陪伴话。
- `POST /api/agent/hooks` 是领域 Hook 入口，用于健康异常、主人回家、进食变化、外观变化等事件。
- `POST /api/agent/cron/tick` 可手动触发一次 Cron 陪伴事件，便于端到端验证和录制前排练。
- `POST /api/agent/timer/tick` 保留为兼容入口，但语义也指向 `cron.companion_checkin`。
- `GET /api/agent/status` 的 `petEventRuntime` 字段暴露当前 Cron 状态、表达式、interval、nextRunAt、threadId 和已发送事件数。

Cron 陪伴的生成要求：

- 中午可以围绕“主人可能在吃午饭或准备午休”主动说话，但在没有真实传感器证据时必须用温和推测，例如“是不是在吃饭呀”。
- 上午、下午、傍晚、晚上和深夜分别对应开工陪伴、犯困缓冲、等主人回家、安静收尾和提醒休息。
- 具体话术由 Agent 生成，不在代码里硬编码固定句子。
- 输出仍然必须落成一条 `ThreadMessage`，对话页和桌宠气泡同源展示。

Storyboard Hook 只用于手动演示或视频排练，不是默认 Cron：

1. `demo.window_sun`：窗边晒太阳。
2. `demo.bird_watch`：阳台小鸟。
3. `demo.nap`：小鸟飞走后垫子打盹。
4. `owner.returned`：听到主人回来，跑向门口。

这些 Hook 生成的文本也必须是小狗自己对主人说的话，并且是应用对话页、桌宠气泡和后续左右分屏视频的同一条内容来源。

## Memory

Memory 是主群聊的一部分，至少分四类：

- `participant_memory`：用户称呼、习惯、偏好、照护节奏。
- `pet_memory`：当前宠物角色设定、宠物档案、宠物偏好、近期状态。
- `event_memory`：今天说过什么、承诺完成什么、触发过什么动作。
- `thread_summary`：长期群聊的滚动摘要，避免无限塞历史消息。

用户显式要求“记住”时，Agent 应调用 memory 工具写入结构化 memory。

当前实现有两层保障：

- OpenCode/opencode 可通过 `ai_pet_record_care_memory` 或 `ai_pet_record_memory` 写入 thread store。
- API adapter 对“记住/记一下/以后/下次”等显式表达做确定性捕获，避免模型没调用工具导致记忆丢失。

## 输出模式

输出模式由用户意图或 UI 控件决定：

- `text`：Agent 返回文字群聊消息。
- `voice`：Agent 调用语音回复工具，优先返回 Qwen TTS 语音消息，可附 transcript 作为记录。

语音回复不是所有文字回复的后处理。只有当前回合选择或请求语音时，才走语音工具。

## 发送后等待态与宠物养护建言

对话页发送后等待态属于 UI 状态，不属于主群聊消息，也不能写入 thread store。

当前等待态的产品口径：

- 用户消息提交成功后，消息列表底部显示轻量省略等待态，表示宠物正在组织回复。
- 等待态不显示“旺财正在听，马上回你”这类宠物气泡文案；“正在听”更像语音输入阶段，不能代表 Agent 生成阶段。
- 等待态不显示宠物头像、宠物名字或气泡尾巴，避免被误认为一条真实宠物回复。
- 等待态下方轮播宠物养护建言。建言是等待期间的辅助信息，不是 Agent 正式回复，不进入历史消息。
- Agent 返回、失败或本地 fallback 完成后，等待态和建言必须消失。
- `ChatHome` 的线程水合不能覆盖已经发生的本地发送中消息；如果发送期间历史水合或主动提醒返回，只能与当前消息做去重合并。
- 当前非流式 Demo 阶段，前端对 `/api/agent/chat` 设置 18 秒请求超时。真实 Agent 超时或失败时走本地宠物回复，避免等待态永久停留。

参考实现来自本机 Lomo / Normal 建言系统：

- 省略等待：`/Users/rencan/mathmodel/reslab-all/reaslab_normal/reaslab-iipe/reaslab-fe/reaslab-ide/components/ide/sidebar/reaslingo/Chat/MessageList.tsx` 的 `BreathingDots`。
- 建言轮播：`/Users/rencan/mathmodel/reslab-all/reaslab_normal/reaslab-iipe/reaslab-fe/reaslab-ide/components/ide/sidebar/reaslingo/AphorismTicker.tsx`。

AI Pet 只能复用交互机制，不能照搬数学/代码产品 tips。AI Pet 版建言文案必须围绕宠物养护，例如换粮过渡、饮水变化、抓挠观察、散步清洁、体重记录、耳朵清洁和高温出行风险。

当前非流式接口阶段：

- loading 时只显示省略点和建言轮播。
- 不区分 `Thinking` / `Receiving response` 文案。
- 后续如果接入流式 token，可扩展成 Lomo 的分层状态：首 token 前是思考等待；开始出字后是正在接收回复；长时间无事件时才显示弱超时提示。

## 基础工具

当前对话页 Agent 至少需要这些工具：

- `get_pet_profile`
- `get_pet_state`
- `get_daily_tasks`
- `record_memory`
- `record_care_event`
- `complete_task`
- `recommend_products`
- `request_pet_motion`
- `reply_with_voice`

自然语言示例：

- “请转圈” -> `request_pet_motion({ action: "spin" })`
- “语音回复我” -> `reply_with_voice(...)`
- “推荐低敏湿巾” -> `recommend_products(...)`
- “记住我每天 8 点喂它” -> `record_memory(...)`

## 动作快路径

Demo 阶段对明确动作请求采用可验收的快路径：

- 后端先根据用户输入规划 `request_pet_motion`，生成动作命令，确保 UI 与桌宠不会因模型慢响应而没有动作反馈；motion 工具结果不作为聊天气泡展示。
- 宠物口吻回复优先通过 llmmelon OpenAI-compatible `/chat/completions` 生成，默认模型为 `LLMMELON_MODEL`/`AI_PET_AGENT_MODEL`，可用 `LLMMELON_FAST_MOTION_MODEL` 单独覆盖。
- llmmelon 动作快路径默认 25 秒超时并短重试；失败时允许本地 persona 兜底，但仍必须返回同一个动作命令。
- 最终 Electron E2E 必须验证 `apiResponses[0].provider = "llmmelon-direct"`、聊天流不出现“桌宠动作”气泡、`active-motion-pill` 或桌宠实际动作可见、关闭窗口后桌宠恢复。

## 接口边界

应用窗口前端只负责：

- 渲染群聊。
- 收集用户输入和输出模式。
- 播放语音消息。
- 展示语音、推荐和记忆工具卡片；不展示 motion 工具卡片。

后端负责：

- 调用 OpenCode/opencode runtime adapter；OpenAI Agents SDK 路径只作为 fallback。
- 维护主 thread/session。
- 注入当前宠物 persona、显示身份和 memory。
- 执行业务工具。
- 返回文字、语音和工具结果。

桌宠动作由动作仲裁层执行。对话页不能直接解析自然语言并操控桌宠，必须通过 Agent 工具调用进入 `request_pet_motion`。
