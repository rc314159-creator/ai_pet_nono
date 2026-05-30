---
title: 对话页 Agent 动作链路 E2E 未返回动作问题记录
description: 记录用户要求通过 agent 对话让顶部宠物和桌宠执行动作，但 Electron E2E 中发送动作请求后没有 agent 回复、工具卡片或动作状态的问题。
status: 已修复
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
domain_taxa:
  - agent-runtime
  - app-window
  - desktop-runtime
  - e2e
related:
  - ../modules/agent-chat-2026-05-30.md
  - ../architecture/current-system-architecture-2026-05-30.md
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
---

# 对话页 Agent 动作链路 E2E 未返回动作问题记录

## 事实时间线

- 2026-05-30：用户要求对话页顶部宠物形象固定在上方，下方对话可滚动；通过和 agent 对话，可以让宠物做对应动作，并同步到桌宠。
- 2026-05-30：Electron E2E 已验证对话页布局方向基本正确：`.chat-pet-stage` 位于上方，`.chat-thread` 是独立滚动容器，composer 固定在底部。
- 2026-05-30：同一轮 Electron E2E 中向对话页发送“回头看一下”后等待约 9 秒，页面只出现主人消息，没有出现宠物回复、工具卡片或 `active-motion-pill`。
- 2026-05-30：直接请求 `/api/agent/chat` 可返回本地 fallback 的动作结果，但该结果不能等同于 llmmelon + OpenCode/opencode 主 agent 链路通过。
- 2026-05-30：最终 Electron E2E 使用 `desktop-photo-pet` 集成入口复验，通过桌宠打开应用窗口，发送“旺财，回头看一下，然后告诉我你在做什么”，页面出现 llmmelon 回复、`桌宠动作` 工具卡片和 `active-motion-pill`，关闭应用窗口后桌宠恢复。

## 证据引用

- E2E 证据目录：`/tmp/e2e-verify/ai-pet-agent-motion-fixed-stage/`。
  - `01-chat-fixed-stage-before-action.png`：顶部宠物区域固定，下方对话区域可滚动。
  - `02-agent-motion-after-message.png`：发送动作请求后只有主人消息，没有 agent 回复或工具卡片。
- E2E 采集到 `active=""`、`toolCards=[]`，消息列表中仅新增用户消息。
- `/api/agent/status` 显示主路径配置为 `opencode:llmmelon`，本地环境变量已配置 llmmelon；因此问题不应再用 Qwen 聊天 provider 解释。
- 最终 E2E 证据目录：`/tmp/e2e-verify/ai-pet-integrated-close-agent-motion-llmmelon-final/`。
  - `01-desktop-pet-visible.png`：初始桌宠窗口可见。
  - `02-app-window-chat-before-action.png`：点击桌宠后打开应用窗口，左上角可见 `关闭应用窗口`，顶部宠物区固定。
  - `03-agent-request-sent.png`：发送动作请求后页面出现 loading。
  - `04-agent-motion-replied.png`：llmmelon 回复出现，工具卡片为 `桌宠动作回头看`，动作状态为 `正在回头看`。
  - `05-desktop-pet-restored-after-close.png`：点击关闭后只剩 `AI Pet Photo Desktop Pet` 桌宠窗口。
  - `summary.json`：`apiResponses[0].provider = "llmmelon-direct"`、`motion = "look_back"`、`failedRequests = []`、`consoleIssues = []`。

## 根因

已确认的直接根因是端到端链路没有把“用户动作请求 -> agent 工具调用 -> 动作命令 -> UI 顶部宠物动作 -> 桌宠动作”作为一个完整验收项执行。此前只验证了局部 UI 或后端 fallback，没有证明真实 Electron 应用窗口中发送消息后能及时得到工具卡片和动作反馈。

进一步根因：

- 显式动作请求不应等待完整 OpenCode/opencode 多轮工具链才能给 UI 反馈；Demo 阶段需要先把 `request_pet_motion` 工具调用、工具卡片和动作命令确定下来，再让模型生成宠物口吻回复。
- llmmelon 中转存在偶发慢响应或临时渠道错误。动作链路必须保留本地兜底，保证动作命令和工具卡片不会因为一次模型超时消失。
- React 动作头像原本用 `<img src>` 快速切换逐帧 PNG，Electron 中会出现帧请求被中止的 `net::ERR_ABORTED`。E2E 将网络错误作为问题处理后，必须改成预加载后 canvas 绘制帧，避免帧切换产生网络中断。

## 修复结果

- `server/agent.ts`：对明确动作请求先规划 `request_pet_motion` 工具调用并立即生成动作工具卡，再通过 llmmelon Chat Completions 生成宠物口吻回复。
- `server/agent.ts`：动作快路径默认使用 `LLMMELON_MODEL`/`AI_PET_AGENT_MODEL`，支持 `LLMMELON_FAST_MOTION_MODEL` 覆盖；默认等待 25 秒，并对 llmmelon 主模型做一次短重试。
- `server/agent.ts`：如果 llmmelon 慢响应或临时失败，仍返回本地动作回复、工具卡片和动作命令，避免 UI 静默卡住。
- `src/components/MochiMotionAvatar.tsx`：顶部宠物形象改为预加载动作帧后用 canvas 绘制，消除逐帧 `<img src>` 切换导致的 active network abort。
- `index.html`：补充 Electron renderer CSP，清除开发窗口 console warning。

## 修复计划

1. 先恢复并确认应用窗口左上角关闭键，避免测试时仍落在旧窗口或错误入口。
2. 直接验证 `/api/agent/status` 和 `/api/agent/chat`，确认 llmmelon + OpenCode/opencode 的当前响应行为。
3. 修复 agent 请求失败时的响应速度和前端反馈，确保动作请求至少返回可见工具卡片和动作命令，不能在 UI 中静默卡住。
4. 用 Electron Playwright 复验：打开 `desktop-photo-pet`，点击桌宠进入对话页，发送明确动作请求，逐张截图确认：
   - 顶部宠物区保持固定。
   - 下方对话可以独立滚动。
   - 宠物消息出现。
   - 工具卡片出现。
   - `active-motion-pill` 出现对应动作。
   - 关闭应用窗口后桌宠恢复。
5. 将最终验证结果回写本文、`docs/INDEX.md` 和实现日志。

## 最终验证

- `npm run typecheck` 通过。
- `npm run build` 通过。
- 直接请求 `/api/agent/chat`，输入“旺财，回头看一下，然后告诉我你在做什么”，返回 `provider = llmmelon-direct`、`model = claude-sonnet-4-6`、`motionCommand.action = look_back`、工具卡片包含 `桌宠动作`。
- Playwright Electron E2E 通过：`/tmp/e2e-verify/ai-pet-integrated-close-agent-motion-llmmelon-final/summary.json` 中 `failedRequests = []`、`consoleIssues = []`，关闭后窗口列表只剩 `AI Pet Photo Desktop Pet`。
