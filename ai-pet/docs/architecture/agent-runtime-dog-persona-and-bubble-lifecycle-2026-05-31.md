---
title: AI Pet Agent Runtime、Dog Persona 与桌宠气泡生命周期
description: 明确 AI Pet 中 Agent Runtime、Dog Persona、后台数据 Hook、定时 Tick、ThreadMessage 与桌宠气泡展示生命周期的边界。
status: 已批准
created: 2026-05-31
updated: 2026-05-31
update_reason: 对齐用户要求：先把 Agent 大脑、狗狗伙伴表达和气泡短时展示逻辑写清楚，再开发验证。
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

- 每条新 `ThreadMessage.id` 最多展示一次。
- 展示时长固定为 5-10 秒，当前 Demo 取 8 秒。
- 展示结束后隐藏，不在下一轮轮询中重复显示同一条消息。
- 动作循环、appearance 轮询、窗口恢复和定时轮询都不能重播已经展示过的 `messageId`。
- 如果应用窗口关闭时最新消息已经在桌宠上展示过，桌宠恢复后不再重复播报。
- 如果应用窗口关闭时存在桌宠从未展示过的新消息，则恢复后展示一次 8 秒。

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

## 当前实现偏差

当前代码仍有以下偏差，后续开发必须纠正：

- OpenCode/opencode 目前是通过 CLI adapter 一次性调用，不是长期运行的宠物大脑。
- `createProactiveAgentMessage` 仍是项目侧手写规则，不是由 Agent Runtime 的 timer/hook 主循环统一触发。
- 部分主动文案仍偏管理员，例如“今天我会盯住三个重点”。
- 桌宠 runtime 曾把同一条最新消息在轮询、窗口恢复和可见性变化时反复展示。

## 开发准则

- 先把事件和角色边界写进知识库，再改代码。
- 所有可见宠物消息必须先落到 `ThreadMessage`。
- 所有桌宠气泡必须以 `messageId` 去重。
- 桌宠气泡展示结束后必须隐藏。
- 定时 tick 和后台 hook 后续必须接入 Agent Runtime，而不是散落在 React 组件或单个 Express route。
