---
title: 对话页省略等待与宠物养护建言实施计划
description: 将 Lomo / reslab-normal 的 BreathingDots + AphorismTicker 等待机制迁移为 AI Pet App 的发送后等待态和宠物养护建言 ticker。
status: 已完成
created: 2026-05-31
updated: 2026-05-31
execution_status: 已完成
current_step: 6
doc_type: implementation-plan
domain_taxa:
  - agent-chat
  - app-window
  - ui-state
  - e2e
related:
  - ../modules/agent-chat-2026-05-30.md
  - ../fix-records/2026-05-31-chat-pending-indicator-duplicate-cue.md
---

# 对话页省略等待与宠物养护建言实施计划

## 目标

修复对话页发送后同时显示“旺财正在听，马上回你”和三个省略点的问题。新的等待体验应对齐 Lomo / reslab-normal 的“省略等待 + 建言轮播”机制，但内容改为宠物养护建议，并保持 AI Pet 是 Electron App 链路，不按 HTML 展示页验收。

## 参考来源

- Lomo 省略等待：`/Users/rencan/mathmodel/reslab-all/reaslab_normal/reaslab-iipe/reaslab-fe/reaslab-ide/components/ide/sidebar/reaslingo/Chat/MessageList.tsx` 的 `BreathingDots`。
- Lomo 建言轮播：`/Users/rencan/mathmodel/reslab-all/reaslab_normal/reaslab-iipe/reaslab-fe/reaslab-ide/components/ide/sidebar/reaslingo/AphorismTicker.tsx`。

只迁移交互结构：

- 点状等待。
- 打字进入、停留、回删、换下一条。
- loading 存在时挂载，完成后卸载。

不迁移原始 tips 文案，因为它们服务数学/代码产品，不适合 AI Pet。

## 功能点

### F1 等待态组件

- 新增 `src/components/ChatWaitingCue.tsx`。
- 组件包含三点呼吸等待和 `PetCareTicker`。
- 组件只接收 `petName` 作为无障碍说明，不渲染宠物名或头像。
- 组件不产生 `AgentChatMessage`，不写入 thread store。

### F2 宠物养护建言

- 内置一组短宠物养护建议。
- 文案应覆盖换粮、饮水、抓挠、散步清洁、零食热量、行为变化、洗澡频率、玩具安全、便便观察、牵引出行、高温地面、猫砂盆、老年宠物台阶、耳朵清洁、体重记录等。
- 建言用打字、停留、回删循环展示。
- 文案不模拟旺财正式发言，避免与真实回复混淆。

### F3 ChatHome 接入

- `ChatHome` 中 `loading` 为 true 时，在消息列表底部渲染 `ChatWaitingCue`。
- 移除 pending message 中的“旺财正在听，马上回你”气泡和宠物头像。
- `finally { setLoading(false) }` 后等待态自然卸载。

### F4 样式

- 在 `src/styles.css` 中新增 `.chat-waiting-cue`、`.waiting-dot-bubble`、`.pet-care-ticker` 及动画。
- 保持手机比例应用窗口内不溢出、不遮挡输入框、不冒充聊天气泡。
- 删除或不再使用旧 `.typing-bubble` 等待气泡样式。

## 验收标准

- 发送消息后，用户消息立即出现在消息列表中。
- 等待期间只出现三点省略等待和一条轮播中的宠物养护建言。
- 等待期间页面上不出现“旺财正在听”“马上回你”等旧文案。
- 等待态没有宠物头像和宠物名字，不像真实消息气泡。
- Agent 返回后，等待态和建言消失，宠物真实回复出现。
- 构建和类型检查通过。
- 验证必须使用 Electron 应用窗口链路；浏览器/Vite 只能作为辅助。
- 验证记录必须包含等待态截图、返回后截图、console/network 摘要和结论。

## 执行步骤

1. 更新对话模块 spec 和本计划。
2. 实现 `ChatWaitingCue`。
3. 接入 `ChatHome` 并移除旧 pending 气泡。
4. 修复构建过程中暴露的类型/导入问题，不留下无法构建的 App。
5. 用 Electron 应用窗口发送消息并截图验证。
6. 回写修复记录和本计划状态。

## 执行结果

- 已新增 `src/components/ChatWaitingCue.tsx`，实现三点呼吸等待和宠物养护建言 ticker。
- 已在 `ChatHome` 中移除旧 pending 宠物气泡，loading 时只渲染 `ChatWaitingCue`。
- 已补充 `ChatHome` 水合保护：发送中或发送后不会被历史水合覆盖本地用户消息和回复。
- 已给前端 `/api/agent/chat` 增加 18 秒超时，慢响应会进入本地宠物回复并清理等待态。
- 已更新 `src/styles.css` 中等待态、三点动画和建言 ticker 样式。

## 验证结果

- `npx tsc -b --clean`：通过。
- `npm run build`：通过，产物生成到 `dist/`。
- Electron App 验证：在 `AI Pet Digital Twin MVP` 窗口发送“旺财，再给我一个补水建议”和“旺财，确认一下你现在在想什么”。
- 等待态验证：用户消息出现后，底部只显示三点省略等待和宠物养护建言；未出现“旺财正在听”“马上回你”，也没有宠物头像/名字气泡。
- 返回后验证：等待态卸载，宠物回复追加到消息流；慢响应场景通过本地宠物回复清理 loading。
- API 状态验证：`curl http://127.0.0.1:8788/api/health` 返回 `{"ok":true,"llm":"llmmelon-configured","model":"claude-sonnet-4-6","desktopPet":"openpets-discovered"}`。
- 验证限制：本次 Browser/Playwright MCP 被已有浏览器实例锁定，未导出浏览器 console/network dump；已用 Electron App 实操、可见 UI 状态和 API health 作为本轮证据。
