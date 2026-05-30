---
title: 2026-05-31 桌宠气泡重复展示与 Agent/Dog Persona 逻辑未对齐问题记录
description: 记录桌宠气泡反复展示同一条消息、展示时长过长，以及 Agent Runtime 和 Dog Persona 概念未写清导致实现继续偏离用户意图的问题。
status: 修复中
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - desktop-runtime
  - bubble-lifecycle
  - agent-runtime
  - dog-persona
related:
  - ../architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md
  - ../architecture/product-logic-framework-2026-05-31.md
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - ../modules/agent-chat-2026-05-30.md
---

# 2026-05-31 桌宠气泡重复展示与 Agent/Dog Persona 逻辑未对齐问题记录

## 事实时间线

- 2026-05-31，用户指出桌宠气泡反复展示同一条消息：“旺财收到。今天我会盯住三个重点：早餐 138g、抓挠 30 分钟、还有晚上的照护任务。”
- 用户明确：一条消息既然已经展示过一遍，不应该继续展示；每次出新消息只需要固定展示 5 到 10 秒，之后不需要重复展示。
- 用户同时要求先把整体逻辑写清楚，特别是“Dog Persona 是什么”，再开发和端到端验证。

## 证据引用

- `desktop-photo-pet/runtime.js` 中 `sharedBubbleHoldMs` 被设置为 `30 * 60 * 1000`，导致气泡可见时间长达 30 分钟。
- `runtime.js` 每 1600ms 调用 `pollLatestThreadBubble()`，并在 app window closed、visibilitychange、init 时使用 `force: true` 拉取最新消息；旧逻辑没有用“已展示 messageId”做严格去重。
- `pollLatestThreadBubble({ force: true })` 会绕过同一 messageId 判断，造成窗口恢复或可见性变化时重复播报旧消息。
- 当前知识库虽然写了“同源气泡”，但没有明确“气泡是短时 presentation，不是常驻通知或重复轮询输出”。

## 根因

1. 桌宠气泡生命周期被误建模成“最新消息状态”，而不是“新消息事件的短时展示”。
2. `force` 语义过粗，既用于“主动拉取最新消息”，又绕过去重，导致旧消息重复显示。
3. `sharedBubbleHoldMs` 为了防止动作说明覆盖气泡，被临时设为 30 分钟，但这违背了用户对桌宠气泡短时展示的期望。
4. Agent Runtime、Dog Persona、ThreadMessage、Desktop Speech Bubble 的层级没有单独文档化，导致修复容易在局部代码上打补丁。

## 正确框架

- Dog Persona：用户可见的狗狗伙伴表达层，把后台事实转成狗狗自己的感受和请求。
- Agent Runtime：不可见的大脑，接用户输入、timer tick、domain hook 和工具结果，最终写入 `ThreadMessage`。
- ThreadMessage：对话页和桌宠气泡共同引用的唯一文本事实源。
- Desktop Speech Bubble：`ThreadMessage` 的短时展示，不是常驻状态。

桌宠气泡规则：

1. 只展示用户可见的宠物消息。
2. 每个 `messageId` 最多展示一次。
3. 每次展示 5-10 秒，当前 Demo 固定 8 秒。
4. 展示结束后隐藏气泡。
5. 轮询、窗口恢复、可见性变化和动作命令都不能重播已经展示过的消息。
6. 如果有新消息到达，展示新消息并替换当前气泡。

## 修复计划

1. 新增 Agent Runtime、Dog Persona 与桌宠气泡生命周期架构文档。
2. 更新产品框架、联动协议和对话模块 spec，把“短时展示一次”写成硬规则。
3. 修改 `desktop-photo-pet/runtime.js`：
   - 把展示时长改为 8 秒。
   - 增加已展示 messageId 集合。
   - `force` 只允许立即拉取，不允许绕过去重。
   - 展示结束后清空并隐藏 speech bubble。
   - init/visibility/app closed 只展示从未展示过的新消息。
4. 运行 `node --check`、`npm run typecheck`、`npm run build`。
5. 用真实 Electron 桌宠验证：新消息显示一次、8 秒左右消失、等待和窗口恢复都不重复显示同一条。
