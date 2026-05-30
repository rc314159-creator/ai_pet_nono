---
title: 2026-05-31 Cron 定时陪伴被误做成固定视频脚本问题记录
description: 记录一分钟循环被误实现为“窗边晒太阳/阳台小鸟/垫子打盹/主人回来”固定脚本，而不是 Agent Cron 根据当前时间和上下文主动生成情感陪伴消息的问题。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - agent-runtime
  - cron
  - dog-persona
  - proactive-companion
related:
  - ../architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md
  - ../modules/agent-chat-2026-05-30.md
---

# 2026-05-31 Cron 定时陪伴被误做成固定视频脚本问题记录

## 事实时间线

- 2026-05-31，用户指出“一分钟循环”不是固定播放视频脚本。
- 用户澄清：一分钟循环应是 Agent 的 Cron 定时任务，按当前时间、上下文和可能的主人场景主动生成情感陪伴话术。
- 用户举例：中午时宠物可以根据“主人可能在吃午饭”这一场景主动沟通；具体话术由 Agent 自己生成。

## 证据引用

- `server/petEventRuntime.ts` 当前把 `timer.daily_life` 映射到 `nextTimerBeat()`。
- `nextTimerBeat()` 固定轮转 `demo.window_sun -> demo.bird_watch -> demo.nap -> owner.returned`。
- `docs/modules/agent-chat-2026-05-30.md` 当前把 60 秒循环写成“按视频逻辑主动分享日常”，这把用户举例误写成了产品逻辑。

## 根因

1. 把“录视频时可参考的示例内容”误当成了 Cron 主循环的固定脚本。
2. 没有区分两类触发：
   - Cron 定时陪伴：Agent 自主判断当前时间和上下文，生成新的陪伴话。
   - Storyboard Hook：为了录制演示，可手动触发某个固定场景事件。
3. 当前 Prompt 没有把 `cron.companion_checkin` 定义为“情感陪伴主动开口”，导致实现自然倾向于固定 beat。

## 正确设计

- 一分钟循环应是 `cron.companion_checkin`，不是 `demo.window_sun` 轮播。
- Cron 只负责唤醒 Agent；内容由 Agent 基于当前时间、最近对话、宠物状态和可选主人场景生成。
- 如果没有真实传感器或日程数据，只能做温和推测，例如“是不是在吃午饭呀”，不能假装已经真实看见主人正在做什么。
- 视频脚本应保留为可手动触发的 Storyboard Hook，不能进入默认 Cron 循环。

## 修复计划

1. 新增 `cron.companion_checkin` 事件类型。
2. `startPetEventRuntime()` 默认触发 `cron.companion_checkin`，不再触发固定 `timer.daily_life` beat。
3. `timer.daily_life` 保留为兼容入口，但语义迁移到 Cron 陪伴。
4. Prompt 增加当前时间、时间段、推测的主人场景、最近群聊和宠物状态。
5. 保留 `demo.window_sun/demo.bird_watch/demo.nap/owner.returned` 作为手动 storyboard hook。
6. 更新知识库，明确 Cron 和 Storyboard Hook 的边界。

## 修复结果

- `server/petEventRuntime.ts` 已新增 `cron.companion_checkin`。
- 默认启动链路改为 `agent-cron -> cron.companion_checkin -> Dog Persona -> ThreadMessage -> DesktopBubble/Motion`。
- Cron Prompt 会传入当前本地时间、时间段、weekday、推测主人场景、推测置信度、陪伴意图、最近群聊和宠物状态。
- `demo.window_sun/demo.bird_watch/demo.nap/owner.returned` 仍保留为手动 Storyboard Hook，但不再由一分钟 Cron 自动轮播。
- 新增 `POST /api/agent/cron/tick`；`POST /api/agent/timer/tick` 作为兼容入口改为触发 `cron.companion_checkin`。
- `GET /api/agent/status` 的 `petEventRuntime` 返回 `cronExpression`、`intervalMs`、`nextRunAt` 等 Cron 状态。

## 验证结果

- `npm run typecheck`：通过。
- `npm run build`：通过。
- 手动触发中午 Cron：
  - 请求：`POST /api/agent/cron/tick`，`createdAt=2026-05-31T12:10:00+08:00`，`payload.ownerActivity=主人可能正在吃午饭`。
  - 返回消息：`主人，是不是在吃午饭呀？我闻到饭香就坐到桌边来了，尾巴摇着不想走——你慢慢吃，我就陪在旁边。`
- 手动触发午饭后场景 Cron：
  - 请求：`POST /api/agent/cron/tick`，`createdAt=2026-05-31T12:13:17+08:00`，`payload.ownerActivity=主人刚吃完午饭，靠在椅子上准备休息，可能有点犯困`。
  - 返回 `provider=llmmelon-pet-event`，`messageId=pet-event-1780169054836-dfce93`。
  - 返回 `motionCommand.context.messageId` 与 `message.id` 一致，`motionCommand.context.bubbleText` 与 `ThreadMessage.text` 一致。
- Electron 端到端验证：
  - 应用窗口对话页出现同一条午饭后陪伴消息。
  - 点击 `关闭应用窗口` 后恢复 `AI Pet Photo Desktop Pet` 桌宠窗口。
  - 桌宠气泡显示同一条消息文本，未显示动作说明或外观系统文案。
  - 气泡约 8 秒后隐藏，再等待 6 秒未重复出现。
- 运行状态验证：
  - `petEventRuntime.cronExpression = "*/1 * * * *"`
  - `petEventRuntime.intervalMs = 60000`
  - `petEventRuntime.nextRunAt` 正常刷新。
