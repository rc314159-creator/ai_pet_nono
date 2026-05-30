---
title: Reaction Commerce / Mailchimp Open Commerce 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: C
---

# Reaction Commerce / Mailchimp Open Commerce

## 基本信息

- 仓库：https://github.com/reactioncommerce/reaction
- Mailchimp 页面：https://mailchimp.com/developer/open-commerce/
- 技术栈：Node.js、React、GraphQL、MongoDB、Docker/Kubernetes。
- 许可证：GPLv3。
- GitHub 快照：12,409 stars、2,187 forks；最新 release `v5.0.0`，发布于 2023-06-13；仓库描述明确标注 Project has been discontinued。
- 官方历史定位：API-first、headless、modular commerce stack。

## 能力拆解

- 架构：Node + GraphQL + MongoDB，Docker/Kubernetes 部署，曾主打 modular/headless commerce。
- 历史能力：multi-tenant、products/variants、inventory、shipping、taxes、fulfillment、admin、emails、plugin system。
- 当前状态：GitHub 仓库已标注 discontinued，新项目不应依赖其维护路线。

## 对 AI Pet 的参考价值

- 可作为早期 headless commerce 设计历史参考，尤其是 plugin、multi-tenant、API-first 的取舍。
- 不建议借鉴其技术选型作为当前 MVP 的落地依据。

## 风险与不足

- 已停止维护路线，不适合新项目底座。
- GPLv3 对商业闭源也有约束。
- 生态和依赖版本可能老化，安全和升级风险较高。

## 初步结论

明确不建议采用。保留为“不要选已 discontinued commerce core”的反例。

## 来源

- https://github.com/reactioncommerce/reaction
- https://mailchimp.com/developer/open-commerce/
