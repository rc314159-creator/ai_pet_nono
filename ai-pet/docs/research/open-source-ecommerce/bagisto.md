---
title: Bagisto 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# Bagisto

## 基本信息

- 仓库：https://github.com/bagisto/bagisto
- 文档：https://docs.bagisto.com/
- 技术栈：Laravel、PHP、Vue.js、Tailwind CSS。
- 许可证：MIT。
- GitHub 快照：26,927 stars、3,136 forks；最新 release `v2.4.4`，发布于 2026-05-05；2026-05-28 仍有 push。
- 官方定位：free and open source Laravel eCommerce platform。

## 能力拆解

- 架构：Laravel 应用型电商框架，覆盖店铺前台、后台、商品、订单等常规电商能力。
- 扩展：官方文档和 README 提到 marketplace、PWA、native mobile app、multi-tenant、B2B、blockchain 等方向，其中多供应商、B2B、多租户等多为付费扩展或附加能力。
- AI 叙事：README 提到可集成 LLM 做 chatbot、自动商品描述、客服、搜索、推荐等。

## 对 AI Pet 的参考价值

- 适合 Laravel/PHP 团队快速构建宠物用品店。
- 商品、订单、后台、移动端扩展比较完整，可参考其“开箱店铺+扩展市场”的商业化路径。
- AI Pet 若要借鉴“AI 商品描述/客服/推荐”入口，可以参考 Bagisto 的集成思路，但不必采用其技术栈。

## 风险与不足

- 当前 AI Pet 主项目是 TypeScript/React，接入 Bagisto 会引入 PHP/Laravel 运维和代码栈。
- 高价值的 marketplace、multi-tenant、B2B 能力可能依赖付费扩展，不能默认当作 MIT core 能力。
- Headless 与 API 能力虽有关键词，但整体体验更像 Laravel 电商应用，而不是纯 composable commerce engine。

## 初步结论

中优先级参考。若未来团队确定转向 Laravel 电商生态可做 PoC；当前 AI Pet 不建议作为主底座。

## 来源

- https://github.com/bagisto/bagisto
- https://docs.bagisto.com/
