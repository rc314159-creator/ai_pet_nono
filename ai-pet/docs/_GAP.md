---
title: AI Pet 知识库缺口记录
description: 记录知识库分类整理后仍需补齐或确认的结构、spec 和证据缺口。
status: 起草中
created: 2026-05-30
updated: 2026-05-31
update_reason: 记录并处理用户激励信息架构此前缺少权威模块 spec 的问题。
doc_type: kb-gap
related:
  - INDEX.md
  - knowledge-base/taxonomy.md
  - product/positioning-framework-2026-05-30.md
---

# AI Pet 知识库缺口记录

## 当前缺口

### 1. 产品定位需要从会议摘要沉淀为正式 product spec

事实：2026-05-30 会议把产品总定位从单一“真实宠物数字分身”扩展为“AI 情感陪伴型宠物产品”，下分真实宠物关联和纯电子宠物两条主线。

已处理：已新增 [AI 宠物产品定位与讨论框架 2026-05-30](product/positioning-framework-2026-05-30.md)，并进一步沉淀为 [AI Pet 当前产品规格](product/product-spec-2026-05-30.md)。当前确认：AI 电子宠物陪伴和真实宠物数字分身共存；优先有真实宠物的人群，同时兼顾无宠陪伴用户；桌宠是核心入口；AI 能力必须接成熟 agent。

待处理：后续产品变更必须直接更新 `product-spec-2026-05-30.md`，不要再让会议摘要或早期计划承担当前真相源。

### 2. 技术架构缺失

事实：旧知识库只有早期 `mvp-architecture.md`，没有按当前产品结论描述应用窗口、桌宠、Agent、Domain、多端入口和模块边界。

已处理：已新增 [AI Pet 技术架构](architecture/technical-architecture-2026-05-30.md)，并在 `INDEX.md` 中设为架构真相源。2026-05-30 14:36 MVP 功能设计讨论后，已同步为“系统级桌宠 + 点击后应用窗口”，并明确项目没有 HTML 展示页。

待处理：实现 OpenCode SDK / opencode runtime 接入后，需要把真实工具名、调用方式和运行脚本回写到技术架构。

### 3. 模块级 spec 缺失

当前已有 [AI Pet 模块分类索引](modules/INDEX.md)，但还缺少按功能域拆开的独立 module spec。建议优先补齐：

- AI 聊天与陪伴模块。
- 真实宠物档案与状态模块。
- mock 设备数据与健康报告模块。
- 日常照护任务模块。
- 换装、电商推荐和商品目录模块。
- 桌宠表达与多端入口模块。
- 纯电子宠物养成模块。

2026-05-30 已新增 [AI Pet 框架化竞品与开源项目调研](research/framework-comparative-research-2026-05-30/INDEX.md)，其中已经把上述模块可借鉴的开源项目和商业产品证据按目录化方式整理。下一步应从该调研包抽取正式 `module-spec`，而不是继续停留在 research 层。

### 4. 验证证据需要独立归档

已有 overnight HTML 报告和结构化结果，但 `verification/` 目录还没有形成稳定入口。后续前端/E2E、截图、运行日志和 demo 验收应归档到 `verification/`，再从 `INDEX.md` 链接。

### 5. 旧文档 frontmatter 不统一

新文档已使用 frontmatter；旧的 `plan/`、`architecture/`、`research/` 文档多数仍是旧格式。后续整理时应逐步补充：

- `title`
- `description`
- `status`
- `created`
- `updated`
- `doc_type`
- `related`

### 6. 物理目录整理需要持续收口

已处理一部分：已新增 [AI Pet 项目目录地图](knowledge-base/project-directory-map-2026-05-30.md)，并把根目录散落截图归档到 `reports/application-window-ui-2026-05-30/` 和 `reports/legacy-root-screenshots/`。

仍待处理：

- `src/components/` 中的早期宽屏 MVP 组件当前未被手机比例应用窗口引用，后续需确认迁移到 legacy 还是删除。
- 桌宠形象线的 `desktop-photo-pet/`、`public/assets/pets/mochi/motions/` 和 `reports/desktop-photo-pet-*` 仍在独立进程中演进，本线暂不整理。
- 旧文档 frontmatter 和报告索引仍需逐步补齐。

### 7. 桌宠动作接口已具备服务端仲裁，真实运行时消费仍待接入

已处理：已新增 [桌宠点击到应用窗口联动协议](architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md)，并在代码中补充 `ExpressionCommand`、`src/domain/motion.ts`、`server/motion.ts`、`/api/agent/chat` 和 `/api/desktop-pet/motion`。当前口径明确：对话页只和 agent 对话，动作能力通过 `request_pet_motion` 暴露给 agent，由 agent 工具调用进入动作仲裁。

仍待处理：桌宠形象运行时还没有消费 `/api/desktop-pet/motion` 或等价 IPC，因此当前代码已经能生成、仲裁和返回动作命令，但真实桌面宠物是否播放对应动作仍依赖桌宠形象线接入动作命令队列。

### 8. 应用窗口与 HTML/前端口径反复混淆

事实：虽然产品规格和技术架构已写明“项目没有 HTML 展示页”，但后续执行仍多次把 Electron 应用窗口用浏览器 localhost 或 HTML 报告口径验证，用户再次指出“前端”和“桌面 App”口径冲突。

已处理：已新增 [应用窗口被误当成前端 HTML 与实际 App 架构记录不足问题记录](fix-records/2026-05-30-app-window-vs-html-architecture-drift.md)，并回补 [AI Pet 技术架构](architecture/technical-architecture-2026-05-30.md) 的“当前实际运行架构”和 [AI Pet 项目目录地图](knowledge-base/project-directory-map-2026-05-30.md) 的运行入口表。

待处理：后续每次涉及应用窗口或桌宠的验证记录，都必须显式写明验证对象是 `desktop-photo-pet` 集成 Electron 链路、standalone `desktop-app` 调试入口，还是浏览器 renderer smoke test。

### 9. 整体系统架构真相源缺失

事实：此前知识库里问题记录和开发计划较多，但缺少一份直接描述当前系统整体架构的文档，导致后续对话需要从多个 fix-record 和计划里拼装真实架构，容易继续误把 App renderer 当成 HTML 页面。

已处理：已新增 [AI Pet 当前系统架构总览](architecture/current-system-architecture-2026-05-30.md)，并把它加入 `docs/INDEX.md` 的新对话必读顺序和架构入口。

待处理：后续代码架构变化必须优先更新该系统架构总览，再同步技术架构、模块 spec 和目录地图。

### 10. 可安装 Demo 和应用内实时知识库缺少正式记录

事实：用户希望把当前项目发给 Mac 试用者，并要求安装后能直接使用；同时要求补全“知识库板块”和实时更新能力。此前知识库只记录项目 `docs/` 治理和主群聊 memory，没有把应用内知识库板块、SSE 实时更新、本地 store、Mac 安装包与 env 打包边界写成正式 spec。

已处理：已新增 [AI Pet 应用内实时知识库模块](modules/live-knowledge-base-2026-05-31.md) 和 [AI Pet Mac Demo 安装交付方案](plan/mac-demo-distribution-2026-05-31.md)，并把它们加入 `docs/INDEX.md`、模块索引、当前系统架构和目录地图。

待处理：后续如果引入正式云数据库、签名/公证、远程同步或账号系统，必须覆盖更新上述两份文档，不能继续把本地 JSON store 描述成正式后台。

### 11. 用户激励信息架构此前只散落在修复记录中

事实：用户指出“我的”页、用户激励、每日任务、排行榜和装扮奖励之间的关系没有在知识库整体框架中写清楚，导致实现时把“我的”页误改成入口集合，并把装扮也做成同级入口。

已处理：已新增 [AI Pet 用户激励、每日任务与奖励解锁模块](modules/user-incentive-2026-05-31.md)，并同步更新产品规格、产品逻辑框架、当前系统架构、技术架构、模块索引和功能范围。当前权威口径是：“我的”页只放用户激励入口，用户激励进入独立子页面；每日任务、排行榜、奖励/可解锁服饰继续进入详情页；装扮仍属于“我的”页内既有功能，奖励服饰必须在用户激励奖励页有解锁来源。

已处理：代码实现和端到端验证已完成，结果已回写到 [2026-05-31 对话页内部 Thread ID 暴露与用户激励闭环缺失问题记录](fix-records/2026-05-31-incentive-loop-and-thread-id-ui-leak.md)。

待处理：后续如果把用户激励迁移到正式 Domain Service 或后端持久层，需要覆盖更新用户激励模块 spec、技术架构和当前系统架构，不能让前端本地 state 被误描述成正式后台。
