---
title: AI Pet 对话页 Agent 群聊模块
description: 记录对话页作为单宠物唯一长期主群聊的产品机制、OpenAI Agents SDK 选型、科技狗 Demo 角色、memory 和工具调用边界。
status: 已批准
created: 2026-05-30
updated: 2026-05-30
update_reason: 根据用户确认，正式以 OpenAI Agents SDK 实现对话页 Agent，并明确语音/文字是不同输出模式。
doc_type: module-spec
domain_taxa:
  - agent-runtime
  - app-window
  - memory
  - mcp-tools
related:
  - ../product/product-spec-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../plan/parallel-development-workstreams-2026-05-30.md
  - ../fix-records/2026-05-30-agent-chat-design-misalignment.md
---

# AI Pet 对话页 Agent 群聊模块

## 当前结论

对话页不是普通聊天框，也不是“文本回复后统一 TTS 播放”的 UI。它是每只宠物唯一的长期主群聊入口，背后由 OpenAI Agents SDK 驱动。

当前 Demo 固定：

- 主 Agent runtime：OpenAI Agents SDK。
- 群聊动物/宠物角色：科技狗。
- 主 thread：一个宠物只有一个主群聊，例如 `pet_mochi_main`。
- 输出模式：用户要求文字就返回文字消息；用户要求语音就返回语音消息。语音是 Agent 工具/输出模式，不是文字消息的固定后处理。

OpenCode / opencode 仍可作为后续后台工具、MCP 生态或开发 agent 参考，但不作为对话页宠物群聊主 Agent。

## 群聊身份

当前对话页呈现为多人群聊，而不是单一用户和助手的问答框。

Demo 群聊：

- 群名：`科技狗家庭群`。
- 固定动物角色：`科技狗`。
- 默认用户角色：`主人`。
- 未来可扩展成员：家人、代遛人、医生、第二只宠物或系统服务。

工具调用不是群成员。工具结果可以呈现为动作卡片、语音卡片、商品推荐卡片或记忆卡片，但不能伪装成另一个聊天人格。

## 长期对话机制

产品层只有一个主对话：

- `petId -> mainThreadId` 一对一。
- 不因文字、语音、动作请求或临时 realtime 连接创建新的产品对话。
- 技术层可以有多个 Agent run、临时 voice connection 或一次性工具执行，但都必须归档到同一个主 thread。

当前 Demo 可先用进程内 session 和前端状态支撑；后续应迁移到持久化 storage。

## Memory

Memory 是主群聊的一部分，至少分四类：

- `participant_memory`：用户称呼、习惯、偏好、照护节奏。
- `pet_memory`：科技狗角色设定、宠物档案、宠物偏好、近期状态。
- `event_memory`：今天说过什么、承诺完成什么、触发过什么动作。
- `thread_summary`：长期群聊的滚动摘要，避免无限塞历史消息。

用户显式要求“记住”时，Agent 应调用 memory 工具写入结构化 memory。

## 输出模式

输出模式由用户意图或 UI 控件决定：

- `text`：Agent 返回文字群聊消息。
- `voice`：Agent 调用语音回复工具，返回语音群聊消息，可附 transcript 作为记录。

语音回复不是所有文字回复的后处理。只有当前回合选择或请求语音时，才走语音工具。

## 基础工具

当前对话页 Agent 至少需要这些工具：

- `get_pet_profile`
- `get_pet_state`
- `get_daily_tasks`
- `record_memory`
- `record_care_event`
- `complete_task`
- `recommend_products`
- `request_pet_motion`
- `reply_with_voice`

自然语言示例：

- “请转圈” -> `request_pet_motion({ action: "spin" })`
- “语音回复我” -> `reply_with_voice(...)`
- “推荐低敏湿巾” -> `recommend_products(...)`
- “记住我每天 8 点喂它” -> `record_memory(...)`

## 接口边界

应用窗口前端只负责：

- 渲染群聊。
- 收集用户输入和输出模式。
- 播放语音消息。
- 展示工具卡片。

后端负责：

- 创建 OpenAI Agents SDK Agent。
- 维护主 thread/session。
- 注入科技狗 persona 和 memory。
- 执行业务工具。
- 返回文字、语音和工具结果。

桌宠动作由动作仲裁层执行。对话页不能直接解析自然语言并操控桌宠，必须通过 Agent 工具调用进入 `request_pet_motion`。
