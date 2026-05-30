---
title: Vendure 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# Vendure

## 基本信息

- 仓库：https://github.com/vendurehq/vendure
- 官网：https://vendure.io/product/core
- 文档：https://docs.vendure.io/
- 技术栈：TypeScript、Node.js、NestJS、GraphQL、React admin dashboard。
- 许可证：GPLv3 社区版或 Vendure 商业许可。
- GitHub 快照：8,160 stars、1,406 forks；最新 release `v3.6.3`，发布于 2026-05-05；2026-05-29 仍有 push。
- 官方定位：open-source TypeScript commerce backend，plugin-first，catalog/orders/pricing/promotions/customers/channels 等核心能力在一个 backend 中。

## 能力拆解

- 架构：NestJS + GraphQL + 插件系统；强调通过稳定 plugin contracts 扩展，不需要 fork core。
- 关键能力：目录、订单、客户、促销、渠道、税、物流、支付、库存、Admin API、Shop API、任务队列、asset server。
- 开发体验：TypeScript 全栈对当前 AI Pet 技术栈友好；插件可承接自定义 loyalty、订阅、推荐、宠物档案约束。

## 对 AI Pet 的参考价值

- 可以把“宠物健康约束影响推荐/促销/补货”的逻辑做成插件。
- GraphQL API 适合应用窗口和桌宠提示聚合数据。
- 如果未来希望所有 commerce 逻辑在一个 NestJS 后端里，Vendure 比多服务 composable 方案更集中。

## 风险与不足

- GPLv3 默认许可证对商业闭源产品有传染性风险，必须先做许可证评审或购买商业许可。
- GraphQL + NestJS + plugin system 的学习成本高于 WooCommerce/Bagisto。
- 生态体量小于 WooCommerce/Magento，但工程可控性更好。

## 初步结论

技术适配度很高，许可证是主要门槛。若接受 GPLv3 开源策略或商业授权，Vendure 是 Medusa 之外最值得做 TypeScript PoC 的候选。

## 来源

- https://vendure.io/product/core
- https://github.com/vendurehq/vendure
- https://github.com/vendurehq/vendure/blob/master/LICENSE.md
