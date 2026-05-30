---
title: Apache OFBiz 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# Apache OFBiz

## 基本信息

- 仓库：https://github.com/apache/ofbiz-framework
- 官网：https://ofbiz.apache.org/
- 技术栈：Java、Groovy、XML、JavaScript。
- 许可证：Apache-2.0。
- GitHub 快照：1,046 stars、684 forks；GitHub API 未返回 latest release；2026-05-29 仍有 push。
- 官方定位：open source product for automation of enterprise processes，覆盖 ERP、CRM、E-Business/E-Commerce、Supply Chain、Manufacturing Resource Planning。

## 能力拆解

- 架构：企业流程自动化套件，不是单纯电商框架。
- 关键能力：ERP、CRM、订单管理、库存/仓储、供应链、制造、会计和电商。
- 适配对象：需要把电商和企业内部流程深度绑定的组织。

## 对 AI Pet 的参考价值

- 对宠物用品供应链、库存、采购、仓储、履约、财务闭环有参考价值。
- 如果 AI Pet 远期服务宠物医院/门店/供应商网络，OFBiz 的 ERP 视角可用于数据模型设计。
- Apache-2.0 许可证非常友好。

## 风险与不足

- 对 AI Pet MVP 过重，UI/开发体验也不是现代 headless commerce 路线。
- 学习和定制成本高，适合企业流程团队，不适合快速产品验证。
- 电商只是 OFBiz 的一部分，不应把它当作轻量 commerce engine。

## 初步结论

不作为底座，作为供应链/ERP 参考。未来若设计宠物用品库存、采购、仓储和履约数据模型，可回看 OFBiz。

## 来源

- https://github.com/apache/ofbiz-framework
- https://ofbiz.apache.org/
