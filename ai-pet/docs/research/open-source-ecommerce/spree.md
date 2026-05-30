---
title: Spree Commerce 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# Spree Commerce

## 基本信息

- 仓库：https://github.com/spree/spree
- 官网：https://spreecommerce.org/
- 文档：https://spreecommerce.org/docs
- 技术栈：Ruby on Rails；官方提供 REST API、TypeScript SDK、Next.js storefront。
- 许可证：BSD-3-Clause。
- GitHub 快照：15,441 stars、5,265 forks；最新 release `v5.4.3`，发布于 2026-05-19；2026-05-29 仍有 push。
- 官方定位：headless eCommerce platform，面向 cross-border、B2B wholesale、marketplace 或 custom commerce backend。

## 能力拆解

- 架构：Rails backend + Admin Dashboard + REST API + TypeScript SDK + Next.js storefront。
- 关键能力：商品、购物车、checkout、客户、订单、multi-region、支付、storefront、B2B/marketplace 场景。
- 开发体验：新版本强调 `create-spree-app` 快速启动和现代 Next.js storefront。

## 对 AI Pet 的参考价值

- 如果团队接受 Rails，Spree 是成熟且许可证友好的 headless 选择。
- 官方 TypeScript SDK 和 Next.js storefront 适合与 AI Pet 应用窗口共享前端能力。
- Cross-border/multi-region 可作为未来海外宠物用品或多地区供应商场景参考。

## 风险与不足

- 后端主栈是 Ruby on Rails，与当前项目 TypeScript/Node 不一致。
- AI 推荐、宠物档案约束和健康任务联动需要 Rails 侧定制或外部服务。
- 对小型 MVP 来说，Rails/Spree 运维和团队能力可能是额外成本。

## 初步结论

中高优先级候选。适合 Rails 能力强或看重 BSD 许可证与成熟 commerce 结构的团队；当前 AI Pet 若优先保持 TypeScript 后端，则排在 Medusa/Vendure/Saleor 之后。

## 来源

- https://github.com/spree/spree
- https://spreecommerce.org/
- https://spreecommerce.org/docs
