---
title: Aimeos 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# Aimeos

## 基本信息

- 仓库：https://github.com/aimeos/aimeos-laravel
- Headless 页面：https://aimeos.org/laravel-headless-ecommerce
- 技术栈：PHP、Laravel；也覆盖 Symfony/TYPO3 生态。
- 许可证：Aimeos Laravel package 为 MIT。
- GitHub 快照：8,637 stars、1,109 forks；2026-05-25 仍有 push；GitHub API 未返回 latest release，但仓库有大量 tags。
- 官方定位：Laravel ecommerce package，面向 high-performance shops、marketplaces、B2B、multi-vendor、multi-channel、multi-warehouse、headless JSON REST/GraphQL API。

## 能力拆解

- 架构：可作为 Laravel package 接入既有 Laravel 应用，也有 headless/full shop distributions。
- 关键能力：多供应商、多渠道、多仓、多租户、B2B、订阅、复杂商品、价格规则、JSON REST、GraphQL。
- 性能叙事：官方强调极大商品量和低延迟，但需要实际压测验证。

## 对 AI Pet 的参考价值

- Aimeos 的“多仓、多供应商、订阅、B2B、复杂商品”对宠物用品供应链很有参考价值。
- 商品模型可以参考其复杂商品、bundle、subscription、group pricing 思路。
- 如果未来 AI Pet 需要服务宠物店/诊所采购，而不是只面向宠物主，Aimeos 的 B2B 能力值得继续深挖。

## 风险与不足

- PHP/Laravel 栈与当前项目不一致。
- 官方性能和规模宣传需要独立 benchmark，不可直接作为选型事实。
- 功能丰富意味着模型复杂，MVP 只需要其中很小一部分。

## 初步结论

中优先级。对“宠物用品 B2B/多供应商/订阅补货”很有启发，但不适合作为当前 AI Pet MVP 的第一底座。

## 来源

- https://github.com/aimeos/aimeos-laravel
- https://aimeos.org/laravel-headless-ecommerce
