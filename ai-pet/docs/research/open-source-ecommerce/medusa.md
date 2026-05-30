---
title: Medusa 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# Medusa

## 基本信息

- 仓库：https://github.com/medusajs/medusa
- 文档：https://docs.medusajs.com/
- 技术栈：TypeScript、Node.js。
- 许可证：MIT。
- GitHub 快照：34,049 stars、4,584 forks；最新 release `v2.15.3`，发布于 2026-05-21；2026-05-29 仍有 push。
- 官方定位：commerce platform with built-in customization framework，核心 commerce modules 覆盖 Products、Orders、Customers、Fulfillment 等领域。

## 能力拆解

- 架构：模块化 commerce primitives + workflows + Admin API/Store API。
- 关键能力：商品、库存、购物车、订单、客户、履约、支付、促销、价格、渠道、可自定义数据模型和工作流。
- 开发体验：Node/TypeScript 生态；适合和 React 控制台、AI 推荐服务、桌宠任务系统集成。
- 扩展方向：官方文档列出 marketplace、digital products、subscription-based purchases 等 recipes，适合宠物用品订阅补货和多供应商扩展。

## 对 AI Pet 的参考价值

- 适合承接“宠物档案驱动商品推荐 -> 库存提醒 -> 订阅补货 -> checkout”的交易闭环。
- 可以把 `PetProfile`、`CareTask`、`InventoryItem` 作为自定义模型或外部服务，通过 workflow 触发推荐、折扣和补货提醒。
- MIT 许可证和 TypeScript 栈对本项目最友好，PoC 成本低。

## 风险与不足

- Medusa 是偏开发者的 commerce framework，不是开箱即用商家后台解决所有运营问题。
- 高度定制会带来 workflow、模块边界和升级成本，需要从 PoC 开始验证版本升级路径。
- 若未来只做轻量内容导购，Medusa 可能比 WooCommerce 重。

## 初步结论

AI Pet 自建 commerce engine 的首选候选。建议第二阶段做一个小 PoC：商品目录、库存阈值、宠物过敏/年龄约束、订阅补货推荐、订单 mock checkout。

## 来源

- https://github.com/medusajs/medusa
- https://docs.medusajs.com/learn/fundamentals/modules/commerce-modules
