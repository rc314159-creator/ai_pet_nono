# AI Pet Docs Index

本目录记录 AI 宠物项目的产品定位、调研、架构、Demo 计划、验证证据和修复记录。进入项目工作时先读本页，再按任务读取对应分类文档。

权威边界：`ai-pet/docs/` 是 AI Pet 项目唯一权威知识库。根级 `docs/` 只保留仓库级路由、原始会议记录和参考素材，不是与本目录并列的第二套项目知识库。若根级 `docs/` 与本目录对同一 AI Pet 事实存在冲突，以本目录中已批准 spec 为准，并修正根级入口。

当前硬约束：不要从零开发桌宠前端或 agent 框架，优先复用已经能运行的开源项目和成熟工具协议。
当前交付约束：团队角色是开发，不是展陈或 PPT 包装；目标是明天汇报可实际运行的一版项目展示 Demo，不按多版本路线讨论。开发讨论必须围绕产品到底解决什么问题、需要跑通哪些功能闭环、怎么实现；AI Key 和算力不作为限制条件，AI 功能必须优先接成熟 agent、成熟模型服务或成熟工具协议。项目没有 HTML 展示页；产品第一入口是系统级桌宠，点击桌宠后弹出应用窗口/功能面板承载复杂功能。

## 新对话必读顺序

1. 本页。
2. [AI Pet 产品逻辑与分层框架](architecture/product-logic-framework-2026-05-31.md)。
3. [AI Pet 当前系统架构总览](architecture/current-system-architecture-2026-05-30.md)。
4. [AI Pet 当前产品规格](product/product-spec-2026-05-30.md)。
5. [AI Pet 技术架构](architecture/technical-architecture-2026-05-30.md)。
6. [AI Pet 模块分类索引](modules/INDEX.md)。

## 当前结论

- 总定位：AI 情感陪伴型宠物产品；宠物形象是 AI 陪伴、真实照护解释、虚拟养成和商业推荐的统一载体。
- 产品主线：AI 电子宠物陪伴和真实宠物数字分身共存；电子宠物可以是纯虚拟宠物，也可以是真实宠物在系统中的分身。
- 用户优先级：优先服务已有真实宠物的人群，同时兼顾没有真实宠物但需要 AI 电子宠物陪伴的人群。
- Demo 主闭环：系统级桌宠 + 点击桌宠弹出的应用窗口必须同时跑通，用真实宠物档案、设备/手动数据、照护任务、AI 解释、桌宠核心入口和装扮/后续推荐形成完整开发闭环。
- 当前可运行桌宠底座：只使用 `desktop/photo-pet` 的照片级 Electron 桌宠集成入口；OpenPets 仅保留为历史调研证据，不再保留运行入口、API 桥接或交付版备选路径。
- 桌宠定位：桌宠是核心入口，不是表现层；必须支持常驻、提醒、状态表达、点击展开和轻交互。复杂操作在弹出的应用窗口中完成，并同步回桌宠。
- 应用窗口定位：应用窗口不是 HTML 展示页或营销页，而是点击桌宠后展开的产品功能面板；可用 React/Vite 等前端技术渲染，但产品口径统一称为应用窗口/宠物面板。
- App 可用性口径：用户说“App 不能用”时，默认指完整桌面 App 链路不可用；必须检查或启动 `npm run dev` / `desktop/photo-pet` Electron 进程。`127.0.0.1:5180` 只是 renderer 调试地址，不能当成 App，也不能作为最终验收。
- AI/agent 底座：当前对话主路径是 OpenCode/opencode runtime + `ai_pet` MCP tools；OpenAI Agents SDK 只作为 fallback，不能描述为最终 Agent 底座。
- 健康监测：Demo 不等待真实硬件 API；用足够完整的 mock/手动数据把健康解释、任务、桌宠提醒和汇报闭环跑通。
- 用户激励：从“我的”页点击“用户激励”进入独立子流程；每日任务、排行榜和奖励/可解锁服饰继续进入详情页。装扮仍是“我的”页内既有功能，任何“奖励获得”的服饰或配饰必须在用户激励奖励页有对应解锁来源。
- App 端设置：宠物资料、主人称呼、对话设定、语音偏好和高级 Prompt 补充必须从“我的”页可编辑并持久化；保存后应用窗口、Agent、MCP tools、桌宠气泡对应消息和应用内知识库必须读取同一份 merged settings。
- 换装与商业化：MVP 换装先作为娱乐和陪伴玩法，用内置模板同步到对话主页和桌宠；商品推荐、电商、真实宠物试装和同款推荐作为后续商业化入口预留。
- 安全边界：当前不作为产品讨论焦点；实现层可保留必要底线，但不再作为待用户拍板的问题。

## 知识库治理

- [AI Pet 知识库分类体系](knowledge-base/taxonomy.md)
- [AI Pet 项目目录地图](knowledge-base/project-directory-map-2026-05-30.md)
- [AI Pet 应用内实时知识库模块](modules/live-knowledge-base-2026-05-31.md)
- [AI Pet 知识库缺口记录](_GAP.md)
- [根级 docs 与 ai-pet/docs 双知识库冲突问题记录](fix-records/2026-05-31-root-and-ai-pet-docs-double-knowledge-base.md)

治理规则：AI Pet 的产品、架构、模块、计划、修复记录和验证记录只在 `ai-pet/docs/` 维护；根级 `docs/INDEX.md` 只做轻量路由，不复制本目录的全量清单。

## 产品与会议框架

- [AI Pet 当前产品规格](product/product-spec-2026-05-30.md)
- [AI 宠物产品定位与讨论框架 2026-05-30](product/positioning-framework-2026-05-30.md)

## Demo 计划与范围

- [Demo 范围与产品假设](plan/mvp-scope.md)（历史文件名保留，当前口径以 product spec 为准）
- [Demo 功能锁定](plan/feature-lock.md)
- [MVP 功能设计对齐 2026-05-30](plan/mvp-feature-design-2026-05-30.md)
- [展示阶段并行开发协调 2026-05-30](plan/display-development-coordination-2026-05-30.md)
- [并行开发工作流 2026-05-30](plan/parallel-development-workstreams-2026-05-30.md)
- [Mochi 桌宠动作包生成计划 2026-05-30](plan/desktop-pet-motion-pack-plan-2026-05-30.md)
- [对话页省略等待与宠物养护建言实施计划 2026-05-31](plan/chat-waiting-cue-and-care-ticker-plan-2026-05-31.md)
- [桌宠气泡避让与陪伴语气端到端修复计划 2026-05-31](plan/desktop-bubble-persona-warmth-e2e-plan-2026-05-31.md)
- [Agent Runtime 与本地 fallback 可靠性修复计划 2026-05-31](plan/agent-runtime-fallback-reliability-plan-2026-05-31.md)
- [Mac Demo 安装交付方案 2026-05-31](plan/mac-demo-distribution-2026-05-31.md)
- [Demo 实施计划](plan/mvp-plan.md)（早期计划，需按新 spec 更新后执行）
- [Demo 实现记录 2026-05-30](plan/implementation-log-2026-05-30.md)
- [Demo 实现记录 2026-05-29](plan/implementation-log-2026-05-29.md)
- [宠物游戏与 AI 虚拟宠物调研计划记录 2026-05-30](plan/pet-game-ai-research-plan-2026-05-30.md)

## 架构与数据契约

- [AI Pet 产品逻辑与分层框架](architecture/product-logic-framework-2026-05-31.md)
- [AI Pet 当前系统架构总览](architecture/current-system-architecture-2026-05-30.md)
- [AI Pet 技术架构](architecture/technical-architecture-2026-05-30.md)
- [AI Pet Agent Runtime、Dog Persona 与桌宠气泡生命周期](architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md)
- [桌宠点击到应用窗口联动协议](architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md)
- [历史 MVP 架构](architecture/mvp-architecture.md)（已由技术架构接管）
- [Mock 设备数据规格](research/mock-device-data-spec.md)

## 模块分类

- [AI Pet 模块分类索引](modules/INDEX.md)
- [AI Pet 对话页 Agent 群聊模块](modules/agent-chat-2026-05-30.md)
- [AI Pet 宠物资料、App 设置与 Persona 配置模块](modules/pet-settings-and-persona-2026-05-31.md)
- [AI Pet 宠物外观单一真相源模块](modules/pet-appearance-2026-05-31.md)
- [AI Pet 应用内实时知识库模块](modules/live-knowledge-base-2026-05-31.md)
- [AI Pet 用户激励、每日任务与奖励解锁模块](modules/user-incentive-2026-05-31.md)
- [AI Pet 功能范围与对齐问题](modules/function-scope-2026-05-30.md)
- [AI Pet 基于现有产品和开源项目的功能映射](modules/research-grounded-function-map-2026-05-30.md)

## 调研证据

### 技术底座

- [AI Pet 框架化竞品与开源项目调研 2026-05-30](research/framework-comparative-research-2026-05-30/INDEX.md)
- [开源项目目录化调研 2026-05-30](research/framework-comparative-research-2026-05-30/open-source-projects/INDEX.md)
- [开源桌面宠物底座调研](research/desktop-pet-foundations.md)
- [真实宠物桌面形象路线](research/desktop-real-pet-avatar-2026-05-30.md)
- [AI/Agent 底座调研](research/agent-foundations.md)
- [Agent 仓库快速校验记录](research/agent-repo-scan-2026-05-29.md)

### 健康与设备

- [健康监测与设备数据调研](research/health-monitoring.md)
- [AI+宠物健康项目调研 2026-05-30](research/ai-pet-health-projects-2026-05-30.md)
- [现有宠物健康产品调研 2026-05-30](research/existing-pet-health-products-2026-05-30.md)

### 产品、社区与虚拟宠物

- [现有商业产品目录化调研 2026-05-30](research/framework-comparative-research-2026-05-30/existing-products/INDEX.md)
- [现有宠物相关商业产品调研](research/existing-pet-products/INDEX.md)
- [已存在宠物产品生态层级地图](research/existing-pet-products/ecosystem-product-map.md)
- [宠物情感陪伴与 AI 项目全景调研](research/pet-emotional-ai/INDEX.md)
- [宠物情感陪伴与 AI 分项目卡片](research/pet-emotional-ai/project-cards.md)
- [现有宠物情感陪伴与 AI 产品专项调研](research/pet-emotional-ai/existing-products.md)
- [宠物情感陪伴与 AI 来源地图](research/pet-emotional-ai/source-map.md)
- [宠物社区与 AI 宠物生态调研](research/pet-community-ai-ecosystem/INDEX.md)
- [宠物游戏与 AI 虚拟宠物项目调研](research/pet-game-ai-projects/INDEX.md)

### 商业化与电商

- [开源电商项目调研 2026-05-30](research/open-source-ecommerce/INDEX.md)

## 修复记录

- [2026-05-29 桌面宠物未出现问题记录](fix-records/2026-05-29-desktop-pet-not-visible.md)
- [2026-05-30 桌宠形象 Demo 开源参考边界不清问题记录](fix-records/2026-05-30-desktop-avatar-reference-ambiguity.md)
- [2026-05-30 真实宠物桌宠需 3D/桌面运行时问题记录](fix-records/2026-05-30-desktop-avatar-3d-runtime-requirement.md)
- [2026-05-30 低保真 3D 桌宠形象方向错误问题记录](fix-records/2026-05-30-low-fidelity-3d-avatar-wrong-direction.md)
- [2026-05-30 桌宠过大、拖不动、点击不弹应用窗口问题记录](fix-records/2026-05-30-desktop-photo-pet-click-drag-window-linkage.md)
- [2026-05-30 静态宠物 cutout 上下晃动不是真实动作问题记录](fix-records/2026-05-30-static-cutout-bobbing-not-real-motion.md)
- [2026-05-30 局部裁剪 rig 动画不自然，应改为多帧动作序列问题记录](fix-records/2026-05-30-rigged-cutout-motion-should-be-frame-animation.md)
- [2026-05-30 走路动画速度偏快与动作范围待明确问题记录](fix-records/2026-05-30-walk-animation-speed-and-motion-scope.md)
- [2026-05-30 走路动作不连贯与完整动作包执行问题记录](fix-records/2026-05-30-walk-continuity-and-full-motion-pack-execution.md)
- [2026-05-30 对话页 Agent 设计口径错误问题记录](fix-records/2026-05-30-agent-chat-design-misalignment.md)
- [2026-05-30 参考 App 底部导航与初始页未对齐问题记录](fix-records/2026-05-30-reference-app-nav-welcome-misalignment.md)
- [2026-05-30 应用窗口 Mock 交互不完整问题记录](fix-records/2026-05-30-application-window-mock-interactions-incomplete.md)
- [2026-05-30 Electron 应用窗口宠物形象与桌宠显隐联动问题记录](fix-records/2026-05-30-electron-app-avatar-and-desktop-pet-visibility.md)
- [2026-05-30 应用窗口缺少关闭入口导致桌宠无法恢复问题记录](fix-records/2026-05-30-application-window-close-restore-desktop-pet.md)
- [2026-05-30 装扮页真实同步范围应收敛到桌宠配饰问题记录](fix-records/2026-05-30-outfit-accessory-desktop-pet-sync.md)
- [2026-05-30 应用窗口验证目标误用浏览器问题记录](fix-records/2026-05-30-electron-window-verification-target.md)
- [2026-05-30 应用窗口被误当成前端 HTML 与实际 App 架构记录不足问题记录](fix-records/2026-05-30-app-window-vs-html-architecture-drift.md)
- [2026-05-30 社区页 6 个真实图片卡片未在当前 app 屏幕内可见问题记录](fix-records/2026-05-30-community-six-cards-visible-in-app.md)
- [2026-05-30 对话页名字头像未复用我的页宠物身份问题记录](fix-records/2026-05-30-chat-profile-identity-sync.md)
- [2026-05-30 对话 Agent 误用 Qwen Key 作为聊天模型 Provider 问题记录](fix-records/2026-05-30-agent-chat-provider-qwen-llmmelon-misuse.md)
- [2026-05-30 对话页浏览器端到端卡住与语音不发送问题记录](fix-records/2026-05-30-chat-e2e-ui-stuck-and-voice-not-working.md)
- [2026-05-30 对话页消息名字应位于头像上方问题记录](fix-records/2026-05-30-chat-message-name-above-avatar.md)
- [2026-05-30 对话页 Agent 未正常对话与角色提示词不足问题记录](fix-records/2026-05-30-agent-chat-runtime-and-persona-not-working.md)
- [2026-05-30 对话页 Agent Runtime 未按 OpenCode/Claude Code 等成熟开源 Agent 接入问题记录](fix-records/2026-05-30-agent-runtime-open-source-agent-misalignment.md)
- [2026-05-30 对话页 Agent 动作链路 E2E 未返回动作问题记录](fix-records/2026-05-30-agent-motion-e2e-no-response.md)
- [2026-05-31 对话页历史记录未持久化导致每次进入都是新会话问题记录](fix-records/2026-05-31-chat-history-not-persisted.md)
- [2026-05-31 对话页用户消息连续发送两遍问题记录](fix-records/2026-05-31-chat-user-message-double-send.md)
- [2026-05-31 对话页桌宠动作气泡多余与主动提醒重复问题记录](fix-records/2026-05-31-chat-motion-card-and-proactive-duplicate.md)
- [2026-05-31 关闭应用窗口后桌宠恢复与桌宠气泡同源问题记录](fix-records/2026-05-31-desktop-pet-restore-and-shared-bubble-source.md)
- [2026-05-31 桌宠气泡重复展示与 Agent/Dog Persona 逻辑未对齐问题记录](fix-records/2026-05-31-desktop-bubble-repeat-and-agent-persona-runtime.md)
- [2026-05-31 非 AI 外观气泡与 Hook/Persona 未完整闭环问题记录](fix-records/2026-05-31-non-ai-appearance-bubble-and-hook-persona-gap.md)
- [2026-05-31 Cron 定时陪伴被误做成固定视频脚本问题记录](fix-records/2026-05-31-cron-loop-hardcoded-demo-beats-misalignment.md)
- [2026-05-31 市集推荐页泄露推荐过程说明问题记录](fix-records/2026-05-31-market-recommendation-process-copy-leak.md)
- [2026-05-31 对话页内部 Thread ID 暴露与用户激励闭环缺失问题记录](fix-records/2026-05-31-incentive-loop-and-thread-id-ui-leak.md)
- [2026-05-31 用户激励子页返回按钮与应用关闭按钮重叠问题记录](fix-records/2026-05-31-incentive-subpage-back-close-overlap.md)
- [2026-05-31 状态页返回按钮与应用关闭按钮重叠问题记录](fix-records/2026-05-31-status-page-back-close-overlap.md)
- [2026-05-31 点击桌宠跳过“开始陪伴”初始页问题记录](fix-records/2026-05-31-desktop-pet-click-skips-welcome-page.md)
- [2026-05-31 入口页 Logo 图标素材修正记录](fix-records/2026-05-31-welcome-logo-asset-correction.md)
- [2026-05-31 对话页发送后等待态同时显示文案和省略点问题记录](fix-records/2026-05-31-chat-pending-indicator-duplicate-cue.md)
- [2026-05-31 状态页未严格对齐参考项目交互问题记录](fix-records/2026-05-31-status-page-reference-interaction-misalignment.md)
- [2026-05-31 桌宠显示橙色像素宠物而不是小狗问题记录](fix-records/2026-05-31-orange-pixel-pet-instead-of-dog.md)
- [2026-05-31 桌宠气泡遮挡宠物与陪伴语气不足问题记录](fix-records/2026-05-31-desktop-bubble-overlap-and-companion-persona-warmth.md)
- [2026-05-31 海报初稿误做成主视觉而非图文丰富项目海报问题记录](fix-records/2026-05-31-poster-visual-only-not-content-rich.md)
- [2026-05-31 根级 docs 与 ai-pet/docs 双知识库冲突问题记录](fix-records/2026-05-31-root-and-ai-pet-docs-double-knowledge-base.md)
- [2026-05-31 宠物名字与系统提示词无法在 App 内修改问题记录](fix-records/2026-05-31-profile-and-system-prompt-not-editable.md)
- [2026-05-31 参考视频音轨与画面清晰度优化记录](fix-records/2026-05-31-reference-video-audio-visual-optimization.md)
- [2026-05-31 参考视频朴素 4K 放大未达到用户优化目标问题记录](fix-records/2026-05-31-reference-video-naive-upscale-failed.md)
- [2026-05-31 对话页未返回 Agent 回复而显示默认兜底话术问题记录](fix-records/2026-05-31-agent-chat-fallback-default-reply-investigation.md)

## 已有验证证据

- [AI Pet 应用窗口手机比例截图](../../reports/application-window-ui-2026-05-30/)
- [AI Pet 早期临时截图归档](../../reports/legacy-root-screenshots/)
- [AI Pet 产品框架历史 HTML 看板](../../reports/ai-pet-framework-summary/index.html)（历史验证材料，不代表当前产品形态）
- [宠物沙箱 overnight 历史 HTML 报告](../../reports/pet-sandbox-overnight/index.html)（历史验证材料，不代表当前产品形态）
- [宠物沙箱运行结构化结果](../../reports/pet-sandbox-overnight/run-results.json)
