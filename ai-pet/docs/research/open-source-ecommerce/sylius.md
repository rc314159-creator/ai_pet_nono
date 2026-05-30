---
title: Sylius 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# Sylius

## 基本信息

- 仓库：https://github.com/Sylius/Sylius
- 官网：https://sylius.com/
- 文档：https://docs.sylius.com/
- 技术栈：PHP、Symfony、API Platform。
- 许可证：MIT。
- GitHub 快照：8,481 stars、2,161 forks；最新 release `v2.2.5`，发布于 2026-04-10；2026-05-30 仍有 push。
- 官方定位：Symfony 上的 open-source eCommerce framework，带 REST API，强调测试文化、BDD 和可定制性。

## 能力拆解

- 架构：Symfony ecommerce framework，适合专业 PHP/Symfony 团队做定制商店。
- 关键能力：商品、订单、checkout、支付、配送、促销、API、插件市场。
- 商业边界：Sylius Plus 提供 OnePageCheckout、B2B suite、multi-store、partial fulfillment、returns、loyalty、multi-source inventory 等高级模块。

## 对 AI Pet 的参考价值

- Sylius 的 framework 形态适合高定制 commerce，而不是普通模板商城。
- 插件市场和 Plus 模块说明了开源核心+商业模块的边界，可作为 AI Pet 未来商业模块设计参考。
- 若 AI Pet 面向欧洲电商或 PHP/Symfony 生态合作方，Sylius 可作为候选。

## 风险与不足

- PHP/Symfony 与当前项目栈不一致。
- B2B、多店、多库存等高级能力可能在商业版，不能默认纳入开源 core。
- 对 AI Pet 的“宠物档案+健康约束+AI 推荐”仍需要额外定制。

## 初步结论

中优先级框架。技术质量和许可证友好，但当前项目栈不匹配；适合作为 PHP/Symfony 路线的备选。

## 来源

- https://github.com/Sylius/Sylius
- https://sylius.com/
- https://docs.sylius.com/
