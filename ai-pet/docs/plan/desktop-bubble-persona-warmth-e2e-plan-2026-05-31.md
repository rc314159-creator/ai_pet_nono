---
title: 桌宠气泡避让与陪伴语气端到端修复计划
description: 针对桌宠气泡覆盖宠物本体、宠物消息陪伴感不足的问题，记录架构更新、实现步骤、端到端验证和失败后继续修复方式。
status: 已批准
execution_status: 已完成
created: 2026-05-31
updated: 2026-05-31
current_step: 4
doc_type: development-plan
domain_taxa:
  - desktop-runtime
  - dog-persona
  - prompt-library
  - e2e-verification
related:
  - ../architecture/current-system-architecture-2026-05-30.md
  - ../architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - ../modules/agent-chat-2026-05-30.md
  - ../fix-records/2026-05-31-desktop-bubble-overlap-and-companion-persona-warmth.md
---

# 桌宠气泡避让与陪伴语气端到端修复计划

## 目标

修复两个同源问题：

1. 桌面端宠物气泡不能覆盖宠物本体。
2. 宠物消息要表达陪伴关系和狗狗存在感，而不是系统通知、健康报告或普通助手口吻。

关键约束：应用聊天和桌宠气泡必须继续显示同一条 `ThreadMessage.text`，不能为桌宠生成另一版短文案。

## 架构更新

执行修复前必须先更新以下当前真相源：

- `current-system-architecture-2026-05-30.md`：补充 `desktop/photo-pet` 主进程管理独立透明气泡窗口，并把气泡窗口纳入运行拓扑。
- `agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md`：明确桌宠气泡只是 `ThreadMessage` 的 presentation，独立窗口不能生成第二套文案。
- `desktop-pet-app-window-linkage-protocol-2026-05-30.md`：明确气泡生命周期、位置避让和窗口显隐规则。
- `agent-chat-2026-05-30.md` 如后续修改 Agent 群聊契约，需要同步补充角色卡示例和同源消息约束。

## 实现计划

1. 问题记录
   - 新增修复记录，写清事实时间线、证据、根因和修复计划。
   - 更新 `ai-pet/docs/INDEX.md`。

2. 桌宠气泡 UI
   - 在 `desktop/photo-pet/main.cjs` 中新增独立 `BrowserWindow` 作为 speech bubble window。
   - 气泡窗口使用透明、置顶、点击穿透、跳过任务栏配置。
   - 根据桌宠窗口 bounds 和当前屏幕 workArea 计算气泡位置，优先上方，其次左右侧，最后下方兜底。
   - 应用窗口打开或桌宠隐藏时同步隐藏气泡。
   - 桌宠拖拽时同步更新气泡位置。

3. 同源消息链路
   - `desktop/photo-pet/runtime.js` 保留现有 `messageId` 去重和 8 秒显示生命周期。
   - runtime 接收到 `ExpressionCommand.context.bubbleText` 或 `/api/desktop-pet/bubble` 的最新消息后，通过 preload IPC 传给主进程显示。
   - runtime 不改写文案、不裁剪成桌宠专用短文案。

4. Dog Persona / Prompt
   - 参考成熟角色卡写法，把抽象“warm”拆成 visible identity、relationship、living scene、speech habits、example dialogues 和 hard boundaries。
   - 借鉴 Neko/猫娘 prompt 的结构优势：明确主人关系、依赖与关心、专属动作与口癖、场景锚点和示例对话。
   - 转译为狗狗陪伴角色：使用“汪/呜/哼唧”、摇尾巴、凑近、爪爪、肚皮、钥匙声、饭碗、趴在旁边等锚点。
   - 同步 OpenCode prompt、本地 persona、主动事件 prompt 和本地 fallback，避免模型失败时风格回退。

## 端到端验证计划

必须按完整桌面 App 链路验证，不以浏览器 renderer 代替：

1. 静态检查
   - `git diff --check`
   - `node --check desktop/photo-pet/main.cjs`
   - `node --check desktop/photo-pet/preload.cjs`
   - `node --check desktop/photo-pet/bubble-preload.cjs`
   - `npm run typecheck`
   - `npm run build`

2. 启动完整 App
   - 清理旧的 `AI Pet Demo.app`、旧 `desktop/photo-pet`、旧 Vite/API 进程，避免端口和窗口混淆。
   - 运行 `npm run dev`。
   - 确认 API 监听 `127.0.0.1:8788`，renderer 监听 `127.0.0.1:5180`，Electron 桌宠窗口出现。

3. 气泡避让验证
   - 通过 `POST /api/desktop-pet/say` 写入一条宠物消息。
   - 使用 Computer Use 或全屏截图确认桌宠气泡显示在宠物上方或侧上方，没有覆盖宠物头部和身体。
   - 使用 `GET /api/desktop-pet/bubble?threadId=pet_mochi_main` 确认气泡文本与最新 `ThreadMessage.text` 一致。

4. 窗口生命周期验证
   - 点击桌宠本体，确认应用窗口打开且桌宠/气泡隐藏。
   - 点击应用窗口关闭入口，确认应用窗口关闭后桌宠恢复。
   - 恢复后如果没有新 `ThreadMessage.id`，不重复播报旧气泡。

5. Persona 兜底验证
   - 用 `npx tsx` 调用 `createLocalAgentTurn()`，至少验证：
     - “我有点累，先不想看数据”
     - “你怎么突然冒出来了？”
     - “晚点再帮你看肚皮”
     - “请转个圈”
   - 预期输出有陪伴关系、狗狗动作或拟声词，不出现系统播报、工程词或双文案。

## 失败处理

- 如果气泡仍遮挡宠物：调整 `getBubbleBounds()` 的 placement 优先级、窗口尺寸估算和屏幕边界 clamp，再重新截图验证。
- 如果气泡不出现：检查 preload IPC、`bubble.html` 加载、`showSpeechBubbleWindow()`、`BrowserWindow` 透明窗口 show/focusable 配置。
- 如果 `/say` 写入后桌宠显示另一条文案：检查 `runtime.js` 是否绕过 `ThreadMessage.text` 生成了 fallback speech。
- 如果应用窗口打开时气泡仍可见：检查 `hidePetWindowForAppWindow()` 是否同步调用 `hideSpeechBubbleWindow()`。
- 如果 Persona 仍偏系统口吻：增加示例对话而不是只加抽象形容词，并同步 local fallback。

## 执行结果

已完成：

- 桌宠气泡改为独立透明跟随窗口，避开宠物本体。
- 气泡仍由 `ThreadMessage.text` 驱动，未拆出桌宠专用文案。
- OpenCode prompt、Domain persona、本地 fallback、主动事件 prompt 已同步强化陪伴语气。
- 完整 Electron 桌宠链路已验证通过。

验证命令与结果：

- `git diff --check`：通过。
- `node --check desktop/photo-pet/main.cjs && node --check desktop/photo-pet/preload.cjs && node --check desktop/photo-pet/bubble-preload.cjs`：通过。
- `npm run typecheck`：通过。
- `npm run build`：通过。
- `npm run dev` + `/api/desktop-pet/say` + Computer Use / 全屏截图：通过，气泡在宠物外侧，不覆盖宠物本体。
