---
title: AI Pet 知识库缺口记录
description: 记录知识库分类整理后仍需补齐或确认的结构、spec 和证据缺口。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
update_reason: 同步 MVP 功能设计讨论后的知识库缺口状态。
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

### 6. 物理目录整理尚未执行

目前只通过 `INDEX.md` 和新分类文档建立逻辑分类，没有移动旧文件。若后续要迁移到 `product/`、`modules/`、`verification/` 等标准结构，需要单独做整理计划，避免破坏已有链接和历史证据。
