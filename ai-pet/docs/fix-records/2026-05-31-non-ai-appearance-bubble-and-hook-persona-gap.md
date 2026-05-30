---
title: 2026-05-31 非 AI 外观气泡与 Hook/Persona 未完整闭环问题记录
description: 记录并修复桌宠仍显示“当前未穿戴配饰”等非 AI 生成气泡、Agent 陪伴主题不足、Timer/Domain Hook 尚未形成统一 Runtime 主循环的问题。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - desktop-runtime
  - agent-runtime
  - dog-persona
  - event-hook
  - prompt-design
related:
  - ../architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md
  - ../architecture/product-logic-framework-2026-05-31.md
  - ../modules/agent-chat-2026-05-30.md
  - ../modules/pet-appearance-2026-05-31.md
---

# 2026-05-31 非 AI 外观气泡与 Hook/Persona 未完整闭环问题记录

## 事实时间线

- 2026-05-31，用户确认气泡重复展示已被关注后，继续指出桌宠仍会显示“当前未穿戴配饰”这类文案。
- 用户明确要求：桌宠气泡和 Agent 对话里展示的内容都应该是 AI 生成的陪伴内容，而不是外观模块、系统状态或产品后台文案。
- 用户要求重新对齐当前任务完成度、角色提示词设计、陪伴主题表达和 Hook 机制。

## 证据引用

- `server/appearance.ts` 的 `buildAppearanceState()` 当前仍会生成 `note: "当前未穿戴配饰。"` 或 `note: "已换上..."`。
- `desktop-photo-pet/runtime.js` 的 `pollAppearance()` 当前仍会把 `appearance.note` 送入 `showSpeechBubbleOnce()`。
- `.opencode/prompts/ai-pet-companion.md` 和 `src/domain/agent.ts` 已经有 Dog Persona 约束，但不是所有桌宠可见文本都经过该 Persona。
- `architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md` 已写明 Timer/DomainHook 应进入 `PetEvent -> Agent Runtime -> Dog Persona -> ThreadMessage`，但当前实现中 `createProactiveAgentMessage()` 仍是手写规则，尚未形成统一主循环。

## 根因

1. “气泡生命周期”已经修正为短时展示，但“气泡文本来源”仍没有收紧到唯一 AI/Dog Persona 输出。
2. 外观、换装、状态模块仍保留系统 note 字段，并被桌宠 runtime 当成用户可见气泡。
3. Agent prompt 有陪伴约束，但项目还没有强制所有用户可见文本都通过 Agent Runtime 生成 `ThreadMessage`。
4. Timer Tick 和 Domain Hook 目前主要停留在文档设计和 `createProactiveAgentMessage()` 入口，没有独立 Runtime loop、冷却策略、事件去重和统一 Hook 总线。

## 正确产品口径

- 桌宠气泡不是系统 toast。
- “当前未穿戴配饰”“已换上定位徽章”“状态同步完成”这类后台状态不能直接出现在桌宠气泡中。
- 桌宠气泡应只展示两类内容：
  1. AI/Dog Persona 生成的 `ThreadMessage.text`。
  2. 必要系统异常经过 Agent Runtime 转写后的 `ThreadMessage.text`。
- 外观、换装、任务、健康、库存等模块只产出结构化事件，不直接产出用户可见气泡。

## 修复结果

1. `desktop-photo-pet/runtime.js` 已移除 `pollAppearance()` 对 `appearance.note` 的直接气泡展示；外观状态仍更新桌宠形象，但“当前未穿戴配饰”“已脱下配饰”等系统状态不再作为桌宠气泡直接出现。
2. `server/petEventRuntime.ts` 新增最小 Pet Event Runtime，把 `timer.daily_life`、视频演示 beat、`owner.returned`、`health.scratch_high`、`food.ate_more`、`appearance.changed` 汇入统一入口。
3. Runtime 输出链路固定为 `PetEvent -> Dog Persona Prompt -> ThreadMessage -> MotionCommand.context.messageId/bubbleText -> DesktopBubble`；桌宠气泡和对话页显示同一条 `ThreadMessage.text`。
4. `server/index.ts` 新增 `POST /api/agent/hooks` 和 `POST /api/agent/timer/tick`，并在 `GET /api/agent/status` 暴露 `petEventRuntime` 状态。
5. 一分钟循环默认启用：`AI_PET_PROACTIVE_INTERVAL_MS` 默认 `60000`，`AI_PET_PROACTIVE_DISABLED=1` 可禁用；timer 去重按 tick 槽位处理，同一条消息不会重复展示，但循环不会在四个演示 beat 后当天停摆。
6. `ChatHome` 已增加线程轮询，Hook/Timer 在应用窗口外产生的新 `ThreadMessage` 会合并进对话页。
7. `.opencode/prompts/ai-pet-companion.md` 和 `src/domain/agent.ts` 已收紧狗狗陪伴语气，禁止系统播报、诊断机器人和任务清单式文案。

## 验证结果

- `npm run typecheck`：通过。
- `npm run build`：通过，生成 `dist/assets/index-BwRdDrhw.js` 与 `build/server/index.cjs`。
- Electron 端到端验证：
  - 打开对话页后，可看到视频逻辑对应的主动消息：窗边晒太阳、阳台小鸟、垫子打盹、主人回来。
  - 触发 `POST /api/agent/hooks` 的 `health.scratch_high` 后，服务端返回的 `message.text` 与桌宠上方气泡文本一致。
  - 同一条 Hook 消息在对话页历史中出现，桌宠气泡展示约 8 秒后隐藏。
  - 关闭应用窗口后，桌宠恢复到桌面态；新 Hook 不会把桌宠气泡替换成“当前未穿戴配饰”等外观系统文案。

## 剩余注意

`.ai-pet-data/thread-store.json` 是本机 Demo 历史数据，里面保留了修复前测试产生的旧消息，例如“今天我会盯住三个重点”。代码路径已修正；录制正式 Demo 前应使用干净的 Demo thread store 或清理历史测试消息，避免旧数据在回放时露出。
