---
title: 2026-05-31 对话页发送后等待态同时显示文案和省略点问题记录
description: 记录用户反馈“旺财正在听”气泡与省略点同时出现导致语义混乱的问题、参考 reslab-normal 建言系统等待态、根因、修复实现和 Electron 验证结果。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - app-window
  - agent-chat
  - ui-state
  - reference-alignment
related:
  - ../modules/agent-chat-2026-05-30.md
  - ../plan/chat-waiting-cue-and-care-ticker-plan-2026-05-31.md
  - 2026-05-30-chat-e2e-ui-stuck-and-voice-not-working.md
---

# 2026-05-31 对话页发送后等待态同时显示文案和省略点问题记录

## 事实时间线

- 2026-05-31，用户在运行中的 AI Pet App 对话页发送“你好你好”后反馈：宠物侧同时显示“旺财正在听，马上回你”和三个省略点，视觉上像“正在听”和“正在思考”两种状态混在一起，表达不自然。
- 用户明确要求先对齐，不要盲目修改；并指出可参考本机 `Math Model / reslab-or` 下 `reslab-test` / `reslab-normal` 版本的“建言系统”在 AI 生成内容时的“省略等待”功能：用户发消息后，上方显示省略等待，下面持续轮播建言。
- 本机实际定位到参考仓库路径为 `/Users/rencan/mathmodel/reslab-all/reaslab_normal`，对应前端实现位于 `reaslab-iipe/reaslab-fe/reaslab-ide/components/ide/sidebar/reaslingo/Chat/MessageList.tsx` 和 `StandaloneChat/StandaloneChatMessageList.tsx`。
- “建言系统”的实际代码命名不是中文“建言”，而是 `AphorismTicker`，文件位于 `/Users/rencan/mathmodel/reslab-all/reaslab_normal/reaslab-iipe/reaslab-fe/reaslab-ide/components/ide/sidebar/reaslingo/AphorismTicker.tsx`。
- 2026-05-31 修复执行中，Electron App 验证发现真实模型响应可能超过 30 秒，等待态会持续停留；因此同步补充前端 18 秒超时和本地宠物回复兜底，保证 Demo 不永久卡在省略等待。

## 证据引用

- AI Pet 当前实现：`ai-pet/src/App.tsx` 在 `loading` 为 true 时插入一条宠物侧 pending message，包含宠物身份、头像、文案 `{displayName}正在听，马上回你` 和 `<i />` 点状等待动画。
- AI Pet 当前样式：`ai-pet/src/styles.css` 的 `.typing-bubble i` 通过一个圆点加 `box-shadow` 渲染三个点，并执行 `typingPulse` 动画。
- 参考实现：`/Users/rencan/mathmodel/reslab-all/reaslab_normal/reaslab-iipe/reaslab-fe/reaslab-ide/components/ide/sidebar/reaslingo/Chat/MessageList.tsx` 定义 `BreathingDots`，等待态作为消息列表底部的轻量状态块出现，不伪装成一条助手回复气泡；未开始输出时显示 `Thinking`，流式输出后切换到 `Receiving response` 或活动时间。
- 参考实现：`StandaloneChat/StandaloneChatMessageList.tsx` 也采用同类 `BreathingDots`，作为居中、弱化的加载提示，而不是生成一条“某某正在听”的聊天消息。
- 参考建言实现：`AphorismTicker.tsx` 内置 `APHORISMS` 文案数组，等待时用 `typing -> holding -> backspacing -> typing` 状态机循环展示。`MessageList.tsx` 和 `StandaloneChatMessageList.tsx` 都在 loading indicator 下方渲染 `<AphorismTicker />`。

## 根因

当前 AI Pet 为解决“发送后像卡住”的问题，把 pending 状态做成了宠物消息气泡，并在同一个气泡内同时放了语义文案和省略点动画。这个实现有两个问题：

1. “正在听”更像输入/语音接收阶段，但真实状态是用户消息已发送、Agent 正在思考或等待模型返回。
2. 省略点已经承担“正在生成/思考”的反馈，再叠加“马上回你”文案会造成状态含义重复，像一条半成品回复。

## 对齐判断

更自然的 App 行为应是：

- 用户消息发送后，输入框进入 loading/disabled 或可中止状态。
- 消息流底部只显示一个轻量省略等待态，表示宠物正在组织回复。
- 省略等待态下方轮播宠物养护建言，例如饮水、散步、清洁、观察异常、换粮过渡、体重管理等短提示。
- 不新增“旺财正在听，马上回你”这种宠物气泡。
- Agent 返回后，等待态移除，直接追加宠物的真实回复。
- 如果后续接入流式输出，可沿用 reslab-normal 的状态分层：未出首字时显示思考等待；开始出字后切换为正在接收/生成；超时再显示弱提示。

## 修复计划

1. 在 AI Pet 对话页移除 pending message 中的“旺财正在听，马上回你”气泡文案和宠物身份块。
2. 保留或抽象一个独立 `TypingIndicator` / `BreathingDots`，放在消息列表底部，样式贴合当前宠物 App 视觉。
3. 参考 `AphorismTicker` 做 AI Pet 版 `PetCareTicker`：复用打字、停留、回删、换下一条的状态机，但文案替换为宠物养护建言，不照搬数学/代码产品 tips。
4. 当前非流式接口阶段，loading 时上方只显示三个点或极短“思考中”弱提示；优先采用用户建议的纯省略点。
5. Agent 返回或失败时必须清理等待态和建言轮播；失败时显示明确错误/重试入口，不能让点状等待永久存在。
6. 修改后用 Electron 应用窗口验证，而不是把浏览器 HTML 当最终入口；至少覆盖发送消息后等待态、建言轮播、返回后等待态消失、console/network 无错误。

## 修复结果

- 新增 `src/components/ChatWaitingCue.tsx`，迁移 Lomo 的三点等待 + ticker 状态机结构，文案替换为宠物养护建言。
- `ChatHome` 的 loading 区域从宠物 pending message 改为独立等待状态，不再渲染“旺财正在听，马上回你”、宠物头像或宠物名字。
- `ChatHome` 的线程水合改为本地发送发生后只做去重合并，避免历史水合覆盖正在发送或刚返回的消息。
- `/api/agent/chat` 前端调用增加 18 秒超时；真实 Agent 慢响应或失败时走本地宠物回复，并在 `finally` 中卸载等待态。
- `src/styles.css` 增加 `.chat-waiting-cue`、`.waiting-dot-bubble`、`.pet-care-ticker` 和对应动画。

## 已对齐结论

- 默认等待态只显示三点省略等待，不显示“正在听/马上回你”等文案。
- 点状等待态不保留宠物头像/名字，不伪装成一条宠物消息。
- 建言文案采用宠物养护建议，不做旺财正式回复口吻，避免和真实回复混淆。

## 验证结果

- `npx tsc -b --clean`：通过。
- `npm run build`：通过。
- Electron App `AI Pet Digital Twin MVP` 验证：发送“旺财，再给我一个补水建议”时，消息列表底部显示三点等待和养护建言轮播，未出现“旺财正在听”“马上回你”。
- Electron App 复验：发送“旺财，确认一下你现在在想什么”后，等待态卸载并追加宠物回复“旺财收到。今天我会盯住三个重点：早餐 138g、抓挠 30 分钟、还有晚上的照护任务。”
- API 健康检查：`GET http://127.0.0.1:8788/api/health` 返回 `ok: true`，模型配置为 `claude-sonnet-4-6`，桌宠发现状态为 `openpets-discovered`。
- 验证限制：Browser/Playwright MCP 被已有浏览器实例锁定，未导出浏览器 console/network dump；本次以 Electron App 实操截图状态、可访问性树和 API health 作为验收证据。
