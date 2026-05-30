# Session Knowledge Base Index

本目录保存跨会话记录、原始会议转写和项目级知识库入口。AI Pet 项目的权威产品、架构、计划和调研入口在 `ai-pet/docs/INDEX.md`。

AI Pet 当前可用性判断必须以桌面 App 链路为准：`desktop/photo-pet` Electron 桌宠 + 点击后应用窗口 + API + renderer 同时运行。`127.0.0.1:5180` 只是 renderer 调试地址，不是 App 入口，也不能作为最终验收。

## Project Docs

- [AI Pet Docs](../ai-pet/docs/INDEX.md)
- [AI Pet 产品逻辑与分层框架](../ai-pet/docs/architecture/product-logic-framework-2026-05-31.md)
- [AI Pet 当前系统架构总览](../ai-pet/docs/architecture/current-system-architecture-2026-05-30.md)
- [AI Pet 当前产品规格](../ai-pet/docs/product/product-spec-2026-05-30.md)
- [AI Pet 技术架构](../ai-pet/docs/architecture/technical-architecture-2026-05-30.md)
- [AI Pet Agent Runtime、Dog Persona 与桌宠气泡生命周期](../ai-pet/docs/architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md)
- [AI Pet 桌宠点击到应用窗口联动协议](../ai-pet/docs/architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md)
- [AI Pet 模块分类索引](../ai-pet/docs/modules/INDEX.md)
- [AI Pet 对话页 Agent 群聊模块](../ai-pet/docs/modules/agent-chat-2026-05-30.md)
- [AI Pet 宠物外观单一真相源模块](../ai-pet/docs/modules/pet-appearance-2026-05-31.md)
- [AI Pet 应用内实时知识库模块](../ai-pet/docs/modules/live-knowledge-base-2026-05-31.md)
- [AI Pet 用户激励、每日任务与奖励解锁模块](../ai-pet/docs/modules/user-incentive-2026-05-31.md)
- [AI Pet MVP 功能设计对齐](../ai-pet/docs/plan/mvp-feature-design-2026-05-30.md)
- [AI Pet 展示阶段并行开发协调](../ai-pet/docs/plan/display-development-coordination-2026-05-30.md)
- [AI Pet 并行开发工作流](../ai-pet/docs/plan/parallel-development-workstreams-2026-05-30.md)
- [AI Pet 对话页省略等待与宠物养护建言实施计划 2026-05-31](../ai-pet/docs/plan/chat-waiting-cue-and-care-ticker-plan-2026-05-31.md)
- [AI Pet Mac Demo 安装交付方案 2026-05-31](../ai-pet/docs/plan/mac-demo-distribution-2026-05-31.md)
- [AI Pet Demo 实现记录 2026-05-30](../ai-pet/docs/plan/implementation-log-2026-05-30.md)
- [AI Pet 装扮页真实同步范围修复记录 2026-05-30](../ai-pet/docs/fix-records/2026-05-30-outfit-accessory-desktop-pet-sync.md)
- [AI Pet 对话页名字头像同步修复记录 2026-05-30](../ai-pet/docs/fix-records/2026-05-30-chat-profile-identity-sync.md)
- [AI Pet 对话页消息名字头像布局修复记录 2026-05-30](../ai-pet/docs/fix-records/2026-05-30-chat-message-name-above-avatar.md)
- [AI Pet 对话页 Agent 未正常对话与角色提示词不足修复记录 2026-05-30](../ai-pet/docs/fix-records/2026-05-30-agent-chat-runtime-and-persona-not-working.md)
- [AI Pet 对话页 Agent Runtime 未按 OpenCode/Claude Code 等成熟开源 Agent 接入问题记录 2026-05-30](../ai-pet/docs/fix-records/2026-05-30-agent-runtime-open-source-agent-misalignment.md)
- [AI Pet 对话 Agent 误用 Qwen Key 作为聊天模型 Provider 问题记录 2026-05-30](../ai-pet/docs/fix-records/2026-05-30-agent-chat-provider-qwen-llmmelon-misuse.md)
- [AI Pet 对话页浏览器端到端卡住与语音不发送问题记录 2026-05-30](../ai-pet/docs/fix-records/2026-05-30-chat-e2e-ui-stuck-and-voice-not-working.md)
- [AI Pet 应用窗口关闭后恢复桌宠修复记录 2026-05-30](../ai-pet/docs/fix-records/2026-05-30-application-window-close-restore-desktop-pet.md)
- [AI Pet 对话页 Agent 动作链路 E2E 未返回动作问题记录 2026-05-30](../ai-pet/docs/fix-records/2026-05-30-agent-motion-e2e-no-response.md)
- [AI Pet 对话页历史记录未持久化导致每次进入都是新会话问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-chat-history-not-persisted.md)
- [AI Pet 对话页用户消息连续发送两遍问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-chat-user-message-double-send.md)
- [AI Pet 对话页桌宠动作气泡多余与主动提醒重复问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-chat-motion-card-and-proactive-duplicate.md)
- [AI Pet 关闭应用窗口后桌宠恢复与桌宠气泡同源问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-desktop-pet-restore-and-shared-bubble-source.md)
- [AI Pet 桌宠气泡重复展示与 Agent/Dog Persona 逻辑未对齐问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-desktop-bubble-repeat-and-agent-persona-runtime.md)
- [AI Pet 非 AI 外观气泡与 Hook/Persona 未完整闭环问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-non-ai-appearance-bubble-and-hook-persona-gap.md)
- [AI Pet Cron 定时陪伴被误做成固定视频脚本问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-cron-loop-hardcoded-demo-beats-misalignment.md)
- [AI Pet 市集推荐页泄露推荐过程说明问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-market-recommendation-process-copy-leak.md)
- [AI Pet 对话页内部 Thread ID 暴露与用户激励闭环缺失问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-incentive-loop-and-thread-id-ui-leak.md)
- [AI Pet 用户激励子页返回按钮与应用关闭按钮重叠问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-incentive-subpage-back-close-overlap.md)
- [AI Pet 状态页返回按钮与应用关闭按钮重叠问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-status-page-back-close-overlap.md)
- [AI Pet 点击桌宠跳过“开始陪伴”初始页问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-desktop-pet-click-skips-welcome-page.md)
- [AI Pet 入口页 Logo 图标素材修正记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-welcome-logo-asset-correction.md)
- [AI Pet 对话页等待态同时显示“正在听”和省略点问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-chat-pending-indicator-duplicate-cue.md)
- [AI Pet 桌宠显示橙色像素宠物而不是小狗问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-orange-pixel-pet-instead-of-dog.md)
- [AI Pet 海报初稿误做成主视觉而非图文丰富项目海报问题记录 2026-05-31](../ai-pet/docs/fix-records/2026-05-31-poster-visual-only-not-content-rich.md)
- [AI Pet 应用窗口被误当成前端 HTML 与实际 App 架构记录不足问题记录 2026-05-30](../ai-pet/docs/fix-records/2026-05-30-app-window-vs-html-architecture-drift.md)
- [AI Pet 功能范围与对齐问题](../ai-pet/docs/modules/function-scope-2026-05-30.md)
- [AI Pet 基于现有产品和开源项目的功能映射](../ai-pet/docs/modules/research-grounded-function-map-2026-05-30.md)
- [AI Pet 真实宠物桌面形象路线](../ai-pet/docs/research/desktop-real-pet-avatar-2026-05-30.md)
- [AI Pet 知识库分类体系](../ai-pet/docs/knowledge-base/taxonomy.md)
- [AI Pet 项目目录地图](../ai-pet/docs/knowledge-base/project-directory-map-2026-05-30.md)
- [AI 宠物产品定位与讨论框架 2026-05-30](../ai-pet/docs/product/positioning-framework-2026-05-30.md)

## Meeting Records

- [会议记录 2026-05-30 11:20](会议记录/会议记录-会议 2026_5_30 11_20_46.md)
- [MVP 功能设计与产品讨论 2026-05-30 14:36](会议记录/MVP功能设计与产品讨论.txt)

## Fix Records

- [2026-05-27 PaperOrchestra report verification gap](fix-records/2026-05-27-paperorchestra-report-verification-gap.md)
- [AI Pet 社区页 6 个真实图片卡片未在当前 app 屏幕内可见问题记录](../ai-pet/docs/fix-records/2026-05-30-community-six-cards-visible-in-app.md)
