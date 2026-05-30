---
title: 对话页历史记录未持久化导致每次进入都是新会话问题记录
description: 记录用户反馈每次进入对话页看不到之前对话、没有上下文的问题，并记录 Demo 阶段本地 thread store、主动提醒和记忆召回修复。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - agent-runtime
  - app-window
  - persistence
  - memory
related:
  - ../modules/agent-chat-2026-05-30.md
  - ../architecture/product-logic-framework-2026-05-31.md
  - ../architecture/current-system-architecture-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
---

# 对话页历史记录未持久化导致每次进入都是新会话问题记录

## 事实时间线

- 2026-05-31：用户反馈“每次进去都看不到对话，显示的都是新的，没有对话历史”，并追问对话历史存在哪个数据库。
- 修复前，`src/App.tsx` 的对话页用 `useState(() => createInitialAgentMessages(context))` 初始化消息列表；组件重新挂载后会重新生成 seed 消息。
- 修复前，`/api/agent/chat` 接收前端传来的 `history` 字段，但后端没有把完整聊天消息写入数据库，也没有提供读取历史消息的接口。
- 修复前，`server/agent.ts` 只有进程内 `threadSessions: Map<string, MemorySession>` 和 `memoryStore: Map<string, AgentMemoryFact[]>`；它们不是持久化数据库，进程重启后丢失，也不等于完整聊天记录。
- 2026-05-31 已实现 Demo 阶段本地 thread store：`server/threadStore.ts` 默认写入 `.ai-pet-data/thread-store.json`，并通过 `.gitignore` 排除本地数据。
- 2026-05-31 已新增 `GET /api/agent/threads/:threadId/messages` 和 `POST /api/agent/threads/:threadId/proactive`。
- 2026-05-31 已让 `/api/agent/chat` 写入用户消息、宠物消息和 memory，并让 Agent 输入合并持久化历史和前端当前历史。

## 证据引用

- 修复前证据：`src/App.tsx` 中 `ChatHome` 的 `messages` 只存在 React state；发送消息后只调用 `setMessages`，没有 `localStorage`、IndexedDB、SQLite 或后端持久化写入。
- 修复前证据：`server/index.ts` 的 `POST /api/agent/chat` 只调用 `createPetAgentReply(req.body)` 并返回结果，没有插入数据库。
- 修复前证据：`server/agent.ts` 的 `threadSessions`、`memoryStore` 都是进程内 `Map`。
- 修复后证据：`server/threadStore.ts` 提供 `getThreadMessages`、`appendThreadMessages`、`getThreadMemories`、`replaceThreadMemories` 和 `appendThreadMemory`。
- 修复后证据：`server/index.ts` 提供 thread messages/proactive API，并在 `/api/agent/chat` 后写入消息和 memory。
- 修复后证据：`src/App.tsx` 的 `ChatHome` 挂载时读取历史消息，随后请求 proactive 主动提醒。

## 根因

当前实现原本只完成了可运行 Demo 的对话展示和 Agent 动作闭环，没有实现主群聊 thread 的持久化数据层。

具体根因：

- 前端把聊天消息保存在组件内存中，关闭/切换/重新进入后重新初始化。
- 后端没有 `messages` 表、thread store 或消息读取接口。
- `MemorySession` 只用于 OpenAI Agents SDK fallback 的进程内 session；当前主路径 OpenCode/opencode 也只拿当前快照和内存事实，不会自动恢复 UI 聊天记录。
- `record_memory`/`memoryStore` 只保存用户显式“记住”的结构化事实，不保存每条聊天消息。

## 正确设计

对话页应有一个真正的主群聊持久层：

- `threads`：`threadId`、`petId`、成员、创建时间、更新时间。
- `messages`：`messageId`、`threadId`、speaker、authorName、text、responseMode、provider、toolCards、audio metadata、createdAt。
- `agent_tool_calls`：每轮工具调用和 motion command。
- `memories`：结构化长期记忆，和普通消息分开。
- API 至少提供：
  - `GET /api/agent/threads/:threadId/messages`
  - `POST /api/agent/chat` 写入用户消息、agent 消息和工具调用。

Demo 阶段可以先用本地 SQLite、JSON 或 JSONL 文件持久化；生产方向再迁移到正式数据库。

## 修复结果

1. 已明确修复前不是数据库持久化，而是前端 state + 后端进程内 memory。
2. 已更新模块文档和新增整体框架文档，避免再把“长期主群聊”误解成只有口径没有实现。
3. 已实现最小持久化层：`server/threadStore.ts`，支持按 `threadId` 读取和追加消息、读取和写入 memory。
4. 前端 `ChatHome` 挂载时先读取历史消息；为空时才使用 seed 消息。
5. `/api/agent/chat` 返回后写入用户消息、宠物消息和工具卡片。
6. Agent 每轮输入合并持久化历史和前端当前历史，并把“记住/记一下/以后/下次”写入长期 memory。
7. “还记得/之前我说过/几点/什么时候”等记忆问题先走本地 memory 召回，避免模型忽略长期记忆。
8. 进入对话页时新增 proactive 主动提醒；异常状态会由狗狗口吻主动开口并触发 `remind` 动作。

## 验证结果

2026-05-31 使用独立测试 store `/tmp/e2e-verify/ai-pet-chat-memory/thread-store.json` 验证：

- `POST /api/agent/threads/:threadId/proactive` 返回主动提醒：“汪，主人，我今天肚皮有点痒...”，并返回 `remind` 动作命令。
- `POST /api/agent/chat` 发送“旺财，记住我晚上八点会帮你检查肚皮”后，`GET /api/agent/threads/:threadId/messages` 可读回主动提醒、用户消息和宠物回复。
- 同一 thread 的 memory 包含 `participant_memory: 我晚上八点会帮你检查肚皮`。
- 继续问“你还记得我晚上几点帮你检查肚皮吗？”时返回 `provider: local-memory`，命中长期记忆并回答“晚上八点”。
- `npm run typecheck` 通过。
