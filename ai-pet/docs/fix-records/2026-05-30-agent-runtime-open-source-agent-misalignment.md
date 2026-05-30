---
title: 2026-05-30 对话页 Agent Runtime 未按 OpenCode/Claude Code 等成熟开源 Agent 接入问题记录
description: 记录用户质疑当前对话页没有按要求使用 OpenCode、Claude Code 等成熟 Agent SDK/runtime，而是偏向自写 Agent glue code 的问题、证据、根因和修复计划。
status: 已修复
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
domain_taxa:
  - agent-runtime
  - mcp-tools
  - app-window
related:
  - ../research/agent-foundations.md
  - ../plan/parallel-development-workstreams-2026-05-30.md
  - ../modules/agent-chat-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
---

# 2026-05-30 对话页 Agent Runtime 未按 OpenCode/Claude Code 等成熟开源 Agent 接入问题记录

## 事实时间线

- 项目知识库早期已明确：AI/Agent 底座方向是 OpenCode SDK / opencode runtime + MCP 或等价成熟工具协议，不从零写 agent 框架。
- 当前代码实际实现为 `@openai/agents` + 本地 `server/agent.ts` 工具 glue code + `src/domain/agent.ts` persona/prompt/fallback。
- 2026-05-30，用户明确质疑：当前究竟有没有用 Agent、用的什么 Agent、为什么没有直接使用 OpenCode / Claude Code 等成熟开源 Agent SDK/runtime。
- 用户再次提供 Qwen/千问 API key，并要求记住；该 key 只能写入本地私有环境配置，不能写入仓库文档或示例文件。

## 证据

- `ai-pet/docs/INDEX.md` 当前结论写明：凡涉及 AI 的地方优先接成熟 agent；当前方向为 OpenCode SDK / opencode runtime + MCP 或等价工具协议。
- `ai-pet/docs/research/agent-foundations.md` 写明第一版推荐 `opencode + MCP + OpenPets`。
- `ai-pet/docs/plan/parallel-development-workstreams-2026-05-30.md` 工作流 D 写明：不要从零写 agent 框架，当前方向是 OpenCode SDK / opencode runtime + MCP 或等价工具协议。
- 当前实现文件 `server/agent.ts` 直接创建 OpenAI Agents SDK Agent 并在项目内维护工具注册、memory、fallback 和 persona 逻辑；这不是 OpenCode / Claude Code runtime。

## 根因

- 后续实现为了快速跑通应用窗口对话，偏离了知识库里“OpenCode / opencode runtime + MCP”的既定方向。
- 把 OpenAI Agents SDK 当成“成熟 agent runtime”等价替代，但没有先更新或征得用户确认，也没有把 AI Pet 业务能力暴露为 MCP 后交给 OpenCode/Claude Code 运行。
- 本地 fallback、memory 和工具补偿逻辑逐渐扩大，造成用户看到“自己写 Agent”的合理质疑。

## 修复计划

1. 立即停止把当前 OpenAI Agents SDK 方案描述成最终 Agent 底座，只保留为临时 Demo fallback/对照路径。
2. 调研并确认 OpenCode 与 Claude Code Agent SDK 的当前官方接入方式、MCP 支持、TypeScript/CLI 调用方式和本项目可落地路径。
3. 优先实现 `ai-pet` MCP server，把现有 `get_pet_profile`、`get_pet_state`、`request_pet_motion`、`reply_with_voice` 等宠物业务能力暴露为 MCP tools。
4. 接入 OpenCode 或 Claude Code Agent SDK/runtime，由成熟 Agent runtime 负责主循环、工具调用和上下文管理；项目侧只负责宠物工具、UI、状态机和提示词。
5. 对话页 `/api/agent/chat` 改为调用成熟 Agent runtime adapter；OpenAI Agents SDK 仅作为临时 fallback，不能作为主路径。
6. 用本地 API 和应用窗口验证：回复 provider/runtime 必须可区分为 `opencode` 或 `claude-code-agent-sdk`，工具调用必须由该 runtime 发起并回写桌宠动作。

## 凭证记录

- 用户提供的 Qwen/千问 API key 已写入本地 `.env.local` 的 `AI_PET_QWEN_API_KEY`；文档只记录“已写入本地私有配置”，不记录具体值。

## 修复结果

- 对话页主运行路径已切换为 OpenCode/opencode runtime + AI Pet MCP tools。
- `server/mcp.ts` 暴露 `get_pet_profile`、`get_pet_state`、`get_daily_tasks`、`recommend_products`、`request_pet_motion`、`record_care_memory` 六个受控 MCP tools。
- `/api/agent/chat` 主路径调用 `runOpenCodePetAgent`；OpenAI Agents SDK 仅作为 fallback。
- 当前对话模型 provider 为 LLM Melon，默认模型 `claude-sonnet-4-6`；`claude-opus-4-6` 已实测可用。
- Qwen key 已限定为语音/TTS 用途，不再作为 OpenCode 对话 provider。
