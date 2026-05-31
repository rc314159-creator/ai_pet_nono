---
title: AI Pet Agent Runtime、Dog Persona 与桌宠气泡生命周期
description: 明确 AI Pet 中 Agent Runtime、Dog Persona、后台数据 Hook、定时 Tick、ThreadMessage、fallback 表达与桌宠气泡展示生命周期的边界。
status: 已批准
created: 2026-05-31
updated: 2026-05-31
update_reason: 明确本地 fallback 不能用健康摘要冒充默认回复，并补充打包应用 OpenCode runtime 的资源根与 CLI 发现要求。
doc_type: architecture-spec
domain_taxa:
  - agent-runtime
  - dog-persona
  - desktop-runtime
  - event-bus
  - prompt-library
related:
  - product-logic-framework-2026-05-31.md
  - desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - ../modules/agent-chat-2026-05-30.md
  - ../fix-records/2026-05-31-desktop-bubble-repeat-and-agent-persona-runtime.md
---

# AI Pet Agent Runtime、Dog Persona 与桌宠气泡生命周期

## 核心结论

AI Pet 的用户不是在和管理员、系统通知、健康助理或客服对话，而是在和一只狗狗伙伴对话。

系统内部可以有监控、健康判断、任务排序、商品推荐和工具调用；但所有用户可见文本必须经过 Dog Persona 表达层，变成狗狗自己的感受、动作和请求。

## 名词边界

### Agent Runtime

Agent Runtime 是不可见的宠物大脑。它负责：

- 接收用户输入、定时 tick 和后台数据 hook。
- 读取宠物档案、设备数据、手动观察、任务、库存和长期记忆。
- 决定是否需要开口、是否调用工具、是否触发桌宠动作。
- 生成或委托生成一条主 thread 里的 `ThreadMessage`。

Agent Runtime 不应该直接把系统判断原样展示给用户。

### Local Fallback

Local fallback 是 Agent Runtime 失败时的安全垫，不是常规分支策略，也不能伪装成模型已经理解了用户问题。

规则：

- 对确定性、无需模型的问题，例如“现在几点了”，本地 fallback 可以直接用本机时间给出简短回答。
- 对无法确定的问题，本地 fallback 只能用 Dog Persona 温和接住，例如“我听见啦，我在旁边陪着，你再跟我说一遍好不好”，不能随机插入进食、抓挠、库存或任务摘要。
- 本地 fallback 的默认回复必须像宠物自然说话，避免系统播报、健康助手口吻、客服口吻和不相干的数据堆叠。
- 调试态必须保留 provider/warning/detail，方便确认用户看到的是 Agent 回复还是 fallback 回复。

### Dog Persona

Dog Persona 是用户可见的狗狗表达层。它不是单独的另一个角色，也不是营销文案，而是 Agent Runtime 最终输出前的角色约束。

Dog Persona 的职责：

- 把后台事实转成狗狗伙伴的说话方式。
- 保留狗狗的身体感、依恋感和日常生活感。
- 避免管理员口吻、诊断口吻和系统播报口吻。

示例：

| 后台事实 | 错误输出 | Dog Persona 输出 |
|---|---|---|
| scratchMinutes 高于基线 | 今天我会盯住抓挠 30 分钟 | 主人，我肚皮有点痒，想让你帮我看看那里。 |
| foodGrams 低于计划 | 早餐摄入不足，请补充喂食 | 我早上好像没吃够，肚子有点空空的。 |
| owner_returned | 检测到主人进入应用 | 你回来啦，我刚刚趴着等你，好想蹭蹭你。 |

### ThreadMessage

`ThreadMessage` 是用户可见消息的唯一文本事实源。

- 对话页渲染 `ThreadMessage.text`。
- 桌宠气泡渲染同一条 `ThreadMessage.text`。
- 右侧视频/图片演示也引用同一条 thread/event 时间线。
- `ExpressionCommand` 只负责动作和唤醒，不能另写一条用户可见文案。

### Desktop Speech Bubble

桌宠上方气泡只是 `ThreadMessage` 的短时 presentation，不是数据库、不是常驻通知、不是轮询日志。

规则：

- 当前 `desktop/photo-pet` 把气泡作为独立透明、置顶、点击穿透的 speech bubble window 展示，由 `main.cjs` 跟随桌宠窗口定位，优先放在宠物上方或侧上方，不能覆盖宠物本体。
- 独立气泡窗口只是 presentation；它仍渲染同一条 `ThreadMessage.text`，不能生成桌宠专用改写文本。
- 每条新 `ThreadMessage.id` 最多展示一次。
- 展示时长固定为 5-10 秒，当前 Demo 取 8 秒。
- 展示结束后隐藏，不在下一轮轮询中重复显示同一条消息。
- 动作循环、appearance 轮询、窗口恢复和定时轮询都不能重播已经展示过的 `messageId`。
- 桌宠启动、刷新或 API 恢复时，第一次读到的服务端最新消息只作为水位线，不展示历史消息。
- 如果应用窗口关闭时最新消息已经在桌宠上展示过，桌宠恢复后不再重复播报。
- 如果应用窗口关闭时存在桌宠从未展示过的新消息，则恢复后展示一次 8 秒。
- 非对话类短提示（例如外观同步 note）也必须有稳定事件 key，走同样的 8 秒短时展示通道，不能因为轮询生成新 `updatedAt` 而重复出现。

## 主动性来源

主动对话不应该只绑定“进入对话页”。

AI Pet 的主动性应来自两类事件：

1. **Timer Tick**：Agent Runtime 每隔固定时间醒来，例如 1 分钟或 5 分钟，判断是否需要主动说一句。Timer 不能无脑发消息，必须检查冷却时间、最近消息和用户打扰状态。
2. **Domain Hook**：后台数据流进入系统后产生领域事件，例如抓挠升高、进食不足、睡眠异常、主人回家、库存不足。领域事件触发 Agent Runtime 判断是否需要开口。

Timer 和 Hook 都必须汇入同一条事件链：

```text
Timer/DomainHook
  -> PetEvent
  -> Agent Runtime
  -> Dog Persona
  -> ThreadMessage
  -> App Chat + Desktop Speech Bubble + Motion Command
```

## 当前实现状态

2026-05-31 当前 Demo 已落地最小 Agent Runtime 闭环：

- `server/petEventRuntime.ts` 是当前最小宠物事件运行时。
- `startPetEventRuntime()` 在 API 服务启动后开启 Agent Cron，默认 5 秒首 tick、随后按 `AI_PET_COMPANION_CRON`/`AI_PET_COMPANION_CRON_INTERVAL_MS` 定时触发；默认等价于每 1 分钟一次，可通过 `AI_PET_PROACTIVE_DISABLED=1` 禁用。
- 默认 Cron 事件是 `cron.companion_checkin`：它不是固定脚本，而是把当前时间、时间段、最近群聊、宠物状态和可选主人场景交给 Agent 生成情感陪伴话。
- `POST /api/agent/hooks` 是领域 Hook 入口，当前支持 `cron.companion_checkin`、`timer.daily_life`（兼容别名）、`demo.window_sun`、`demo.bird_watch`、`demo.nap`、`owner.returned`、`health.scratch_high`、`food.ate_more`、`appearance.changed`。
- Cron 事件按 tick 槽位去重，保证一分钟循环可持续；同一 `ThreadMessage.id` 在桌宠上最多展示一次。
- `demo.window_sun/demo.bird_watch/demo.nap/owner.returned` 只用于手动 Storyboard Hook 或录制排练，不能进入默认 Cron 循环。
- Runtime 会用 llmmelon 生成 Dog Persona 消息；如果模型失败，才用本地狗狗语气模板兜底。
- Runtime 生成的可见文本先写入 `server/threadStore.ts`，再用 `ExpressionCommand.context.messageId` 和 `context.bubbleText` 通知桌宠，保证应用对话页和桌宠气泡同源。
- `desktop-photo-pet/runtime.js` 不再直接展示 `appearance.note`；外观状态只更新形象，用户可见气泡必须来自 `ThreadMessage.text`。
- `ChatHome` 会轮询主 thread，合并 timer/hook 在窗口外产生的新消息。

打包应用的 Agent runtime 要求：

- `AI_PET_AGENT_RUNTIME=opencode` 时，用户发起的对话必须优先走 OpenCode/opencode + `ai_pet` MCP tools。
- 打包应用不能用 `process.cwd()` 推断 OpenCode 项目根，因为从 Finder 启动的 Electron cwd 可能是 `/`；运行时必须使用显式 `AI_PET_OPENCODE_PROJECT_ROOT` 或 `process.resourcesPath` 下的 `opencode.json`。
- `opencode.json` 和 `.opencode/prompts/ai-pet-companion.md` 必须作为可被外部 CLI 读取的资源进入打包产物，不能只放在 asar 内部。
- macOS GUI 启动的 PATH 通常不包含 Homebrew 路径；打包运行时必须补充 `/opt/homebrew/bin` 和 `/usr/local/bin`，或允许 `AI_PET_OPENCODE_BIN` 指向 CLI。
- 如果显式要求 `opencode` 但 runtime 不可用，后端必须返回可诊断的 `opencode_runtime_not_configured` fallback，不能静默切到 OpenAI Agents SDK 后让用户误以为主 Agent 正常。

仍需区分的后续工程方向：

- OpenCode/opencode 当前仍主要服务用户发起的对话工具调用；`PetEventRuntime` 是项目侧最小主动运行时，不等同于完整开源 Agent 常驻进程。
- 当前 Hook 总线是 Express API + 本地事件函数，尚未接真实硬件后台流、消息队列或生产数据库。
- 当前持久层是 `.ai-pet-data/thread-store.json`，生产方向仍应迁移到 SQLite、PostgreSQL 或正式应用数据库。
- 当前没有真实桌面活动识别或摄像头/日历接入时，Cron 只能按时间段温和推测主人场景，例如“是不是在吃午饭呀”，不能假装真实看见主人行为。

## 开发准则

- 先把事件和角色边界写进知识库，再改代码。
- 所有可见宠物消息必须先落到 `ThreadMessage`。
- 所有桌宠气泡必须以 `messageId` 去重。
- 桌宠气泡展示结束后必须隐藏。
- 定时 tick 和后台 hook 后续必须接入 Agent Runtime，而不是散落在 React 组件或单个 Express route。
