---
title: 2026-05-30 对话 Agent 误用 Qwen Key 作为聊天模型 Provider 问题记录
description: 记录 Qwen/千问 API key 只应作为语音模型凭证，却被误用于 OpenCode 对话模型 provider 的问题、证据、根因和修复计划。
status: 已修复
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
domain_taxa:
  - agent-runtime
  - model-gateway
  - voice
related:
  - ../modules/agent-chat-2026-05-30.md
  - 2026-05-30-agent-runtime-open-source-agent-misalignment.md
---

# 2026-05-30 对话 Agent 误用 Qwen Key 作为聊天模型 Provider 问题记录

## 事实时间线

- 2026-05-30 早前，用户提供 Qwen/千问 API key，并明确语境是用于调语音模型。
- 后续修复 OpenCode runtime 时，错误地把 Qwen key 配成 OpenCode 对话模型 provider，导致对话链路从 LLM Melon 偏到 Qwen。
- 2026-05-30 22:32 CST，用户明确指出：Qwen API key 是给语音模型用的；对话模型应继续走 LLM Melon，并要求测试 LLM Melon 上哪些模型可用，特别是 Claude Opus 4.6 和 Sonnet 4.6。

## 证据

- 本地 `.env.local` 中 Qwen 相关 key 已用于 `AI_PET_QWEN_API_KEY` 和 Qwen TTS 配置；该文件被 `.gitignore` 忽略，不能在仓库文档中记录具体密钥。
- `opencode.json` 一度被改成 `qwen/qwen-plus`，这与用户“Qwen key 用于语音”的要求冲突。
- LLM Melon `/v1/models` 实测返回 306 个模型，包含 `claude-sonnet-4-6` 和 `claude-opus-4-6`。
- LLM Melon 实测结果：
  - `claude-sonnet-4-6`：OpenAI-compatible `/chat/completions` 可返回 `pong`；Anthropic-compatible `/messages` 也可返回 `pong`。
  - `claude-opus-4-6`：OpenAI-compatible `/chat/completions` 可返回 `pong`；Anthropic-compatible `/messages` 也可返回 `pong`。

## 根因

- 修复 OpenCode runtime 时为了绕过 LLM Melon 某个旧模型调用慢的问题，临时切到了 Qwen chat compatible endpoint，没有区分“聊天 Agent 模型 provider”和“语音/TTS provider”两条链路。
- `opencodeAgent.ts` 的 provider 默认逻辑错误地看到 Qwen key 就优先选择 Qwen。

## 修复计划

1. 对话 Agent runtime 固定默认走 OpenCode + LLM Melon。
2. OpenCode 默认模型切为已实测可用的 `claude-sonnet-4-6`；`claude-opus-4-6` 作为可切换高能力模型。
3. Qwen 配置只保留在语音/TTS 链路，不参与 OpenCode 对话 provider 选择。
4. 重新验证 `/api/agent/status` 和 `/api/agent/chat` 返回 `opencode:llmmelon`，并验证 MCP tool call 仍能触发桌宠动作。

## 修复结果

- `opencode.json` 已移除 Qwen 对话 provider，默认模型改为 `llmmelon/claude-sonnet-4-6`，并保留 `llmmelon/claude-opus-4-6` 可切模型。
- `.env.local` 已改为 `AI_PET_OPENCODE_PROVIDER=llmmelon`、`AI_PET_OPENCODE_MODEL=claude-sonnet-4-6`、`LLMMELON_MODEL=claude-sonnet-4-6`，并移除 Qwen chat base URL；Qwen key 只保留用于 TTS。
- `server/opencodeAgent.ts` 已取消“看到 Qwen key 就优先选 Qwen”的默认逻辑，默认 provider 固定为 llmmelon。
- 本地验证：
  - `npm run typecheck` 通过。
  - `opencode models llmmelon` 返回 `llmmelon/claude-opus-4-6`、`llmmelon/claude-sonnet-4-6`。
  - OpenCode CLI 使用 `llmmelon/claude-sonnet-4-6` 时真实调用了 `ai_pet_request_pet_motion` 和 `ai_pet_get_pet_state`。
  - `/api/agent/status` 返回 `provider=opencode:llmmelon`、`model=llmmelon/claude-sonnet-4-6`。
  - `/api/agent/chat` 返回 `provider=opencode:llmmelon`、`model=llmmelon/claude-sonnet-4-6`，并回写 `motion.active.action=spin`。
