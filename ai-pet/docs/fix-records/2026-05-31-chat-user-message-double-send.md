---
title: 2026-05-31 对话页用户消息连续发送两遍问题记录
description: 记录陪伴对话页发送同一条用户消息后，消息流中连续出现两条相同主人消息的问题。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - agent-chat
  - app-window
  - message-dedup
  - e2e
related:
  - ../modules/agent-chat-2026-05-30.md
  - ../architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md
---

# 2026-05-31 对话页用户消息连续发送两遍问题记录

## 事实时间线

- 2026-05-31，用户反馈：在对话页发送消息时，会连续发送两遍。
- 用户截图显示：同一条主人消息“好呀”在消息流中出现两次，中间还夹着宠物回复，说明问题可能发生在提交链路、后端持久化或前端历史水合合并链路。

## 初步证据引用

- 用户截图中可见两条相同的主人气泡“好呀”。
- 当前对话页契约要求一个宠物只有一个主 thread，用户单次发送只能落一条 `speaker=user` 消息。
- 当前 `ChatHome` 存在本地乐观消息、后端持久化消息、历史轮询水合和主动 Cron 消息合并，任何一处缺少稳定去重都可能导致重复渲染或重复写库。

## 根因

1. 前端发送时先乐观插入一条用户消息，但后端 `/api/agent/chat` 入库时重新生成新的 `user-*` id。
2. `ChatHome` 的历史轮询按 `id` 合并消息；同一文本如果前端乐观消息和服务端持久化消息 id 不同，就会被当成两条主人消息。
3. 如果 Agent 请求超过前端 18 秒超时，前端会先显示本地 fallback 回复，而服务端请求仍可能继续完成并写入 thread，进一步放大“本地 turn + 服务端 turn”重复显示问题。
4. 发送函数只依赖 React `loading` state 防重复；在同一事件循环内，快速点击或 Enter 可能早于 state 生效。

## 修复计划

1. 查清 `ChatHome` 的发送触发方式、按钮类型和 Enter 行为。
2. 查清 `/api/agent/chat` 请求体和 `server/agent.ts` 写入 thread 的逻辑。
3. 为单次用户发送建立稳定 `clientMessageId`/幂等 key，并在前后端以该 id 去重。
4. 修复后用 Electron 应用窗口实际发送唯一测试文本，确认只出现一条主人消息。
5. 复查 API thread store，确认同一测试文本只落一条用户消息。

## 修复结果

- `src/App.tsx`：
  - 单次发送生成稳定 `clientMessageId` 和 `clientTurnId`。
  - 乐观用户消息使用 `clientMessageId` 作为 `id`。
  - 请求体把 `clientMessageId`、`clientTurnId` 和 `clientCreatedAt` 传给后端。
  - 增加 `sendInFlightRef`，在 React `loading` state 生效前先同步阻止重复提交。
  - Enter 发送时调用 `preventDefault()`，并跳过中文输入法 composing 状态。
  - `mergeMessages` 继续按 `id` 去重，并在同一 `clientTurnId` 下用服务端宠物回复替换客户端本地 fallback。
- `src/domain/agent.ts`：
  - `AgentChatMessage` 增加可选 `clientTurnId`，用于把主人消息和宠物回复归到同一发送回合。
- `server/index.ts`：
  - `/api/agent/chat` 接受并沿用客户端 `clientMessageId`、`clientTurnId`、`clientCreatedAt`。
  - 若同一 `clientMessageId`/`clientTurnId` 已经有完整用户消息和宠物回复，直接返回已有 turn，避免重复写库。
- `server/agent.ts`：
  - Agent 生成的宠物回复保留同一个 `clientTurnId`，便于前端和后端按 turn 去重。

## 验证结果

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 隔离 API 幂等验证：
  - 使用独立 `AI_PET_THREAD_STORE_FILE=/tmp/ai-pet-double-send-thread-store.json` 和端口 `8791`。
  - 同一个 `clientMessageId=user-e2e-double-send` 连续 POST 两次 `/api/agent/chat`。
  - 查询 thread 后，用户消息计数为 `1`，同一 `clientTurnId=turn-e2e-double-send` 的宠物回复计数为 `1`。
- Electron 应用窗口按钮发送验证：
  - 在真实 `AI Pet Digital Twin MVP` 对话页发送 `去重验证 0531 只发一次`。
  - UI 中主人消息只出现一次。
  - `GET /api/agent/threads/pet_mochi_main/messages` 返回同文本用户消息计数为 `1`。
- Electron 应用窗口 Enter 发送验证：
  - 输入 `回车去重验证 0531 只发一次` 后连续按 Enter。
  - UI 中主人消息只出现一次。
  - `GET /api/agent/threads/pet_mochi_main/messages` 返回同文本用户消息计数为 `1`。
