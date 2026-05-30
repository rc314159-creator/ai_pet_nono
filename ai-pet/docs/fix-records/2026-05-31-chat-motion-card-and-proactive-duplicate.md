---
title: 2026-05-31 对话页桌宠动作气泡多余与主动提醒重复问题记录
description: 记录用户反馈“桌宠动作/提醒主人”卡片不需要，以及宠物连续两条肚皮抓挠消息语义重复的问题、证据、根因和修复计划。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - app-window
  - agent-chat
  - proactive-agent
  - motion
  - ui-polish
related:
  - ../modules/agent-chat-2026-05-30.md
  - ../architecture/product-logic-framework-2026-05-31.md
  - 2026-05-31-chat-history-not-persisted.md
---

# 2026-05-31 对话页桌宠动作气泡多余与主动提醒重复问题记录

## 事实时间线

- 2026-05-31，用户指出对话页里“桌宠动作 / 提醒主人”的气泡不需要。
- 同一截图里宠物连续出现两条语义相近的消息：一条是普通宠物回复“主人回来啦，今天肚皮有点痒...”，另一条是主动提醒“汪，主人，我今天肚皮有点痒，抓挠比平时多一点...”，后者下方还有动作工具卡片。
- 本地 `pet_mochi_main` thread store 证据显示：`proactive-alert` 主动提醒、用户消息“你好你好”、`opencode:llmmelon` 宠物回复、第二条 `proactive-alert` 依次写入同一 thread。

## 证据引用

- `server/agent.ts` 的 `createProactiveAgentMessage` 只判断最后一条消息是否为同一条 `proactive-alert`，没有判断最近普通宠物回复是否已经说过同一个抓挠/肚皮问题。
- `src/App.tsx` 进入对话页时先读取持久历史，再请求 `/api/agent/threads/:threadId/proactive`；因此重新进入页面时会再次触发主动提醒判断。
- `src/App.tsx` 渲染所有 `message.toolCards`，其中 `kind: "motion"` 的卡片显示为“桌宠动作 / 提醒主人”。
- `src/domain/agent.ts` 的 `createInitialAgentMessages` 也包含一条抓挠/肚皮红点 seed 消息；如果有持久历史还继续混入 seed，会进一步增加重复感。

## 根因

1. 动作工具调用是给桌宠运行时消费的，不应该作为聊天气泡展示给用户。当前 UI 把 motion tool card 当成普通工具卡片渲染，造成多余气泡。
2. 主动提醒缺少语义去重。它只避免“连续两条完全相同 proactive”，但不能避免“普通宠物回复已说过肚皮痒，随后主动提醒又说一次”。
3. 有持久历史时仍合并 seed 消息，容易把演示初始消息和真实历史混在一起。

## 修复计划

1. 对话页 UI 不再渲染 `kind: "motion"` 的工具卡片；动作仍通过 `motionCommand`/桌宠轮询执行。
2. 有持久历史时不再混入 seed 消息；seed 只用于空 thread 首次进入。
3. 主动提醒增加最近消息语义去重：如果最近宠物消息或 proactive 已经覆盖抓挠/肚皮/红点等同一问题，则本次进入不追加新 proactive。
4. 对既有 thread 中已经存在的重复 proactive，前端展示层做一次轻量过滤，避免旧数据继续出现在页面上。
5. 更新对话模块文档，明确动作工具卡片默认不在聊天气泡中展示。
6. 跑 typecheck/build，并用 Electron 实际进入对话页验证无动作气泡、无重复主动提醒。

## 修复结果

- `src/App.tsx` 新增 motion card 展示过滤：`kind: "motion"` 的工具结果不再渲染到聊天流。
- `src/App.tsx` 有持久化历史时直接使用历史消息，不再把 seed 演示消息混进真实 thread。
- `src/App.tsx` 对旧历史里的重复 `proactive-alert` 做展示层过滤，避免已有脏数据继续显示。
- `server/agent.ts` 的主动提醒增加最近宠物消息语义去重；最近已经说过肚皮/红点/皮肤等同一问题时，返回 `recent_issue_already_covered`，不再追加新提醒。
- `server/agent.ts` 的 proactive 消息不再携带 motion tool card，但仍返回 `motionCommand` 给桌宠执行。
- `src/domain/agent.ts` 的初始 seed 收敛为一条欢迎消息，不再预置一问一答式状态消息。

## 验证结果

- `npm run typecheck` 通过。
- `npm run build` 通过，Electron 加载的 `dist/` 已重新生成。
- API 验证：新 thread 首次 proactive 返回 `remind` 动作命令，但 `message.toolCards` 数量为 0；同一 thread 第二次 proactive 返回 `already_latest`。
- Electron 应用窗口验证：对话页不再显示“桌宠动作 / 提醒主人”卡片；已有 `pet_mochi_main` 历史中旧的重复 proactive 被展示层过滤，页面只显示一条对应提醒。
