---
title: Saleor 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# Saleor

## 基本信息

- 仓库：https://github.com/saleor/saleor
- 官网开源页：https://saleor.io/open-source
- 文档：https://docs.saleor.io/
- 技术栈：Python、Django、GraphQL。
- 许可证：BSD-3-Clause。
- GitHub 快照：22,937 stars、6,034 forks；最新 release `3.23.7`，发布于 2026-05-22；2026-05-29 仍有 push。
- 官方定位：GraphQL native、API-only、composable commerce。

## 能力拆解

- 架构：强 API-only/headless，GraphQL 是核心交互面。
- 关键能力：多渠道 pricing/currency/stock/product 控制，webhooks、metadata、apps、dashboard iframes、API extensions。
- 适配对象：有独立前端、独立业务服务、较强 GraphQL 研发能力的团队。
- 与传统插件式平台差异：Saleor 官方强调扩展服务独立部署，减少核心改动和升级冲突。

## 对 AI Pet 的参考价值

- 多渠道能力适合未来把“宠物控制台、移动端、社区活动页、桌宠气泡”作为不同 channel。
- metadata/webhooks/apps 模式适合把宠物档案、健康约束和 AI 推荐服务外置，而不是侵入 commerce core。
- GraphQL schema 对推荐解释和前端聚合很友好。

## 风险与不足

- Python/Django/GraphQL 会引入当前项目外的新后端栈。
- API-only 对小团队早期运营可能偏重，需要额外 storefront/dashboard 组合。
- 若只是宠物用品轻量交易，Saleor 的 composable 架构可能超出 MVP 所需。

## 初步结论

强候选，但不如 Medusa 贴合当前 TypeScript 项目。适合未来需要多渠道、强 API、独立 AI 推荐服务和更规范扩展时做 PoC。

## 来源

- https://saleor.io/open-source
- https://github.com/saleor/saleor
- https://docs.saleor.io/
