---
title: OpenCart 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# OpenCart

## 基本信息

- 仓库：https://github.com/opencart/opencart
- 官网：https://www.opencart.com/
- 文档：https://docs.opencart.com/
- 技术栈：PHP、JavaScript、Twig。
- 许可证：GPLv3。
- GitHub 快照：8,128 stars、5,041 forks；最新 release `3.0.5.0`，发布于 2025-12-12；2026-05-29 仍有 push。
- 官方定位：free PHP-based online e-commerce solution。

## 能力拆解

- 架构：传统 PHP shopping cart，轻量、上手快、扩展市场成熟。
- 关键能力：商品、类别、订单、客户、支付、物流、主题、扩展。
- 适配对象：小商家、简单独立店铺、已有 OpenCart 生态使用者。

## 对 AI Pet 的参考价值

- 可以参考其轻量商家后台和扩展市场。
- 如果仅做非常简单的宠物用品小店，OpenCart 的部署复杂度低。

## 风险与不足

- 不是 headless/composable 方向，和 AI Pet 的宠物档案/健康任务/AI 推荐服务不天然匹配。
- 自定义复杂业务可能需要传统 PHP 模块开发，工程体验落后于 Medusa/Vendure/Saleor。
- 对现代前端、API-first 和多端支持不如新一代 headless 项目。

## 初步结论

低优先级。适合传统小店，不适合作为 AI Pet 的长期 commerce 底座。

## 来源

- https://github.com/opencart/opencart
- https://docs.opencart.com/
