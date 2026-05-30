---
title: Solidus 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# Solidus

## 基本信息

- 仓库：https://github.com/solidusio/solidus
- 文档：https://guides.solidus.io/
- 技术栈：Ruby on Rails。
- 许可证：BSD-like Spree License。
- GitHub 快照：5,302 stars、1,386 forks；最新 release `v4.7.0`，发布于 2026-04-15；2026-05-29 仍有 push。
- 官方定位：complete open source e-commerce solution built with Ruby on Rails，Spree fork。

## 能力拆解

- 架构：由多个 gems 组成，包含 API、backend/admin、core、sample data。
- 关键能力：Rails ecommerce core、RESTful API、后台、扩展机制。
- 灵活性：可以只用 core gem，结合自定义 frontend/admin/API。

## 对 AI Pet 的参考价值

- 对 Rails 团队是成熟 commerce framework。
- 其 core/admin/API 拆分对 AI Pet 未来抽象 commerce 模块有参考意义。
- 如果已有 Rails 业务生态或客户系统，Solidus 可作为集成候选。

## 风险与不足

- 与当前项目 TypeScript/React/Node 主线不一致。
- 社区体量小于 Spree/WooCommerce/Magento。
- 深度 AI 推荐和宠物健康约束仍需自定义。

## 初步结论

中优先级 Ruby 生态候选。当前 AI Pet 不优先采用，但可与 Spree 一起作为 Rails commerce 参考。

## 来源

- https://github.com/solidusio/solidus
- https://guides.solidus.io/
