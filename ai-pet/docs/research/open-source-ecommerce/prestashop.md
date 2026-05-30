---
title: PrestaShop 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# PrestaShop

## 基本信息

- 仓库：https://github.com/PrestaShop/PrestaShop
- 开源项目页：https://prestashop.com/open-source/
- 开发文档：https://devdocs.prestashop-project.org/
- 技术栈：PHP、Symfony、Bootstrap/TypeScript front theme in PrestaShop 9。
- 许可证：PrestaShop Core OSL-3.0，Modules AFL-3.0。
- GitHub 快照：9,090 stars、5,043 forks；最新 release `9.1.3`，发布于 2026-05-21；2026-05-29 仍有 push。
- 官方定位：由社区维护的 open-source ecommerce solution，自 2007 年发展。

## 能力拆解

- 架构：传统开箱店铺平台，强调商家上手、模块、主题、后台管理。
- PrestaShop 9 方向：Symfony 6.4、PHP 8.1+、新 Admin API、Hummingbird theme、新 back office、SEO 改进、Update Assistant。
- 生态：模块/主题/服务生态成熟。

## 对 AI Pet 的参考价值

- 适合参考传统商家后台、模块市场、主题和 SEO 功能。
- 如果 AI Pet 需要快速给宠物用品小商家部署独立网店，PrestaShop 是可评估对象。
- 新 Admin API 可作为外部系统集成入口，但需实际验证覆盖度。

## 风险与不足

- 传统 monolithic commerce 平台，不是 AI Pet 这种“宠物档案+AI 推荐服务”天然模型。
- OSL/AFL 许可证需要评审。
- 自定义复杂推荐/订阅/健康约束可能需要模块开发，维护成本高于 headless-first 平台。

## 初步结论

中低优先级。成熟但偏传统，不建议作为 AI Pet 核心 commerce engine；可作为商家后台和插件市场参考。

## 来源

- https://github.com/PrestaShop/PrestaShop
- https://prestashop.com/open-source/
- https://devdocs.prestashop-project.org/
