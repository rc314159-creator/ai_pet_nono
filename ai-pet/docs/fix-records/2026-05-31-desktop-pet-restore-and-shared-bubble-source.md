---
title: 2026-05-31 关闭应用窗口后桌宠恢复与桌宠气泡同源问题记录
description: 记录用户要求关闭对话/应用窗口后桌宠必须回到桌面，以及桌宠气泡内容必须和对话页主动消息来自同一条宠物事件的问题、框架和修复计划。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - desktop-runtime
  - app-window
  - agent-chat
  - proactive-agent
  - shared-event-source
related:
  - ../architecture/product-logic-framework-2026-05-31.md
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - ../modules/agent-chat-2026-05-30.md
---

# 2026-05-31 关闭应用窗口后桌宠恢复与桌宠气泡同源问题记录

## 事实时间线

- 2026-05-31，用户再次指出：对话窗口关闭后，桌面宠物应该重新出现；当前运行中又出现“不出现”的情况。
- 用户进一步明确：桌面宠物弹出的气泡内容，应该和问答窗口里它主动说的话一致。产品对话页面产生的内容，和关闭窗口后桌宠自己产生的气泡内容，应该来自同一条信息，不应该分别生成。
- 用户提出一个展示设想：UI 录屏 + 实拍/AI 生成左右分屏。左侧是产品对话界面逐步出现数字小狗当天日常；右侧是小狗在家中真实/生成画面同步播放，例如窗边晒太阳、看小鸟、垫子打盹、听到主人回家跑向门口。
- 2026-05-31 用户补充指出：桌宠底部的 `Mochi 动作帧 · 转身 · 无配饰` 气泡/标签应该删除；桌宠上方唯一气泡必须对齐应用对话页里宠物消息的 content，不允许显示 `Mochi 转了个身。` 这类动作说明。

## 证据引用

- `desktop-photo-pet/main.cjs` 当前在 `appWindow.on("closed")` 中调用 `restorePetWindowAfterAppWindow()`；如果窗口 close 过程异常、窗口只触发 close 未触发 closed、或者桌宠窗口已经被隐藏但没有恢复兜底，就会出现桌宠不回来的风险。
- `desktop-photo-pet/runtime.js` 当前桌宠气泡优先显示 motion command 的 `reason` 或动作 manifest 自带文案；这不是对话页主动消息本身。
- `desktop-photo-pet/renderer.html` 仍然存在 `.mode-label` 元素，`desktop-photo-pet/runtime.js` 还会持续写入动作标签；这会在桌宠底部形成第二个“气泡”。
- `server/agent.ts` 的 `createProactiveAgentMessage` 会把 proactive 消息写入 thread store，并返回 motion command；当前 motion command 未把同一条消息文本作为 bubble source 显式带给桌宠。
- `server/index.ts` 当前没有桌宠直接读取“最新对话宠物消息”的接口；桌宠只轮询 motion 和 appearance。

## 根因

根因不是单纯缺少 show/hide 调用，而是事件源没有统一：

1. 应用窗口对话页、后端 proactive 逻辑、桌宠 motion 气泡各自使用不同数据字段。
2. 桌宠关闭后恢复只依赖 Electron 窗口生命周期中的一个 `closed` 事件，缺少 close/hide/activate 兜底和恢复后主动唤醒桌宠 renderer。
3. 桌宠 renderer 在隐藏期间可能已经轮询并消费了 motion command，窗口恢复时无法保证还会显示同一条对话消息。
4. 动作命令没有关联聊天消息时，runtime 仍会把 `command.reason` 写进上方气泡，导致动作说明冒充宠物对话内容。

## 正确框架

应该建立“同一条宠物事件，多端展示”的框架：

- `ThreadMessage` 是对话页和桌宠气泡的共同文本源。
- `ExpressionCommand` 只负责动作和桌宠唤醒，不重新生成气泡文案。
- `ExpressionCommand.context.messageId` 指向同一条 `ThreadMessage`。
- `ExpressionCommand.context.bubbleText` 可以缓存该消息文本，供桌宠 motion 轮询时立即展示。
- 桌宠恢复后还应能从后端读取最新桌宠气泡事件，例如 `GET /api/desktop-pet/bubble?threadId=pet_mochi_main`。
- 应用窗口关闭时，Electron 主进程必须恢复桌宠窗口，并通知桌宠 renderer 重新拉取最新气泡。
- 桌宠 UI 只允许一个用户可见气泡：上方 speech bubble；底部动作标签只能作为调试信息存在于日志/不可见状态，不能出现在 Demo UI 中。

## 左右分屏展示框架

左右分屏视频不是另一个独立产品逻辑，它应该复用同一条宠物事件时间线：

- 左侧：应用窗口对话页按消息顺序逐步出现。
- 右侧：真实拍摄或 AI 生成的小狗生活片段按同一条消息的 `sceneKey` 或事件标签切换。
- 对话消息、桌宠气泡、右侧素材说明都应从同一个 thread/event 时间线派生。
- 示例消息：
  - 小狗：“今天阳光很好，我在窗边睡了一下午呢~”
  - 小狗：“下午有只小鸟停在阳台上，我盯着它看了好久！”
  - 小狗：“不过它飞走了，我又睡了一觉~”
  - 用户：“你今天吃得多吗？”
  - 小狗：“吃了很多！不过最近好像长胖了一点……”
- 示例右侧素材：
  - `sun-window-nap`：小狗趴在窗边晒太阳。
  - `bird-balcony-watch`：小狗抬头看阳台上的小鸟。
  - `mat-nap`：小狗蜷在垫子上打盹。
  - `door-greeting`：听到主人回家兴奋跑向门口。

## 修复计划

1. 更新产品/架构知识库：明确同源事件框架和左右分屏展示框架。
2. 扩展 `ExpressionCommand.context`，支持 `bubbleText`。
3. proactive 主动消息创建时，先生成消息 ID，再创建 motion command，并把 `messageId` 与 `bubbleText` 写进 command context。
4. 新增桌宠气泡读取接口，从 thread store 读取最新宠物消息，不让桌宠独立生成一套气泡文案。
5. 桌宠 renderer 轮询 motion 时优先使用 `command.context.bubbleText`；窗口恢复或可见时主动拉取最新桌宠气泡。
6. Electron 主进程增强应用窗口 close/closed/hide 恢复兜底，并在恢复后通知桌宠 renderer。
7. 用 Electron E2E 验证：打开应用窗口、产生主动消息、关闭窗口、桌宠恢复、桌宠气泡文本和对话页主动消息一致。
8. 删除/隐藏底部动作标签，禁止 `command.reason` 或 motion manifest speech 顶替已有对话 content。

## 实现结果

- `ExpressionCommand.context` 已增加 `bubbleText`，motion command 不再需要用 `reason` 充当桌宠气泡文本。
- `createProactiveAgentMessage` 先生成 proactive `messageId`，再把同一条消息的 `messageId` 和 `text` 写入 motion command context。
- 新增 `getLatestPetThreadMessage(threadId)` 和 `GET /api/desktop-pet/bubble?threadId=...`，桌宠恢复后可以直接读取最新宠物对话消息。
- `desktop-photo-pet/runtime.js` 在收到 app window closed IPC、窗口重新可见或定时轮询时，拉取同一条 thread message 作为桌宠气泡。
- 桌宠动作循环不再覆盖共享对话气泡；共享气泡会保持一段展示时间，直到后续新消息刷新。
- `desktop-photo-pet/main.cjs` 在 app window close/closed/IPC close 中恢复桌宠；如果桌宠窗口被销毁，会先重建再通知 renderer 拉取气泡。
- `desktop-photo-pet/renderer.html` 已删除底部 `.mode-label`；runtime 不再向用户界面写入 `Mochi 动作帧...` 调试标签。
- motion command 没有 `context.bubbleText` 时，runtime 不再把 `command.reason` 显示为上方气泡，而是强制回读最新 thread message。

## 验证结果

- 类型与构建：`npm run typecheck` 通过；`npm run build` 通过，生成 `dist/` 与 `build/server/index.cjs`。
- 接口级同源验证：新建测试线程 `pet_mochi_e2e_1780162325815` 后，proactive message、motion `context.messageId/context.bubbleText`、`/api/desktop-pet/bubble` 返回值三者完全一致。
- Electron 端到端验证：
  - 初始桌宠窗口显示 `/api/desktop-pet/bubble?threadId=pet_mochi_main` 的最新宠物消息：“旺财收到。今天我会盯住三个重点：早餐 138g、抓挠 30 分钟、还有晚上的照护任务。”
  - 点击桌宠后应用窗口打开，桌宠隐藏，对话页可见同一条宠物消息。
  - 点击左上角 `关闭应用窗口` 后，应用窗口关闭，桌宠窗口恢复到桌面。
  - 恢复后的桌宠气泡仍显示同一条宠物消息，动作标签继续变化但不覆盖该气泡。
- 追加 Electron 端到端验证：
  - 桌宠窗口只剩上方一个 speech bubble；底部 `Mochi 动作帧 · ...` 标签已不可见。
  - 对话页最后一条宠物消息为：“旺财收到。今天我会盯住三个重点：早餐 138g、抓挠 30 分钟、还有晚上的照护任务。”
  - 关闭应用窗口回到桌宠后，上方 speech bubble 显示同一条消息。
  - 等待约 5 秒，桌宠动作帧继续变化，但上方 speech bubble 没有再变成 `Mochi 转了个身。` 或其它动作说明。
