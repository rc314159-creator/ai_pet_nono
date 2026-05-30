---
title: Shopware 6 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# Shopware 6

## 基本信息

- 仓库：https://github.com/shopware/shopware
- 官网：https://www.shopware.com/
- 文档：https://developer.shopware.com/docs/
- 技术栈：PHP、Symfony、Vue.js、Twig、TypeScript。
- 许可证：MIT。
- GitHub 快照：3,354 stars、1,176 forks；最新 release `v6.7.10.1` security release，发布于 2026-05-19；2026-05-29 仍有 push。
- 官方定位：open headless commerce platform，Symfony 7 + Vue.js 3，社区扩展超过 3,100 个。

## 能力拆解

- 架构：成熟电商平台，支持 headless/API-first，同时有传统 shop/admin 体系。
- 关键能力：商品、订单、客户、促销、内容体验、扩展市场、社区商店。
- 生态：欧洲电商生态强，适合商家和 agency 使用。

## 对 AI Pet 的参考价值

- Shopware 的扩展市场和 experience commerce 思路适合参考“内容+商品+品牌体验”。
- 如果 AI Pet 面向欧洲商家、宠物品牌或中型电商客户，Shopware 生态有价值。
- 对商品详情、内容页、活动页和推荐模块的组合可做 UX 参考。

## 风险与不足

- 作为完整平台偏重，不适合 AI Pet MVP 把 commerce 当附属能力的阶段。
- PHP/Symfony/Vue 技术栈与当前 React/TypeScript 主线不一致。
- Headless 虽可用，但深度自定义 AI 推荐仍需要理解其扩展体系。

## 初步结论

中优先级行业参考。适合成熟商家平台，不适合作为 AI Pet 第一版交易底座。

## 来源

- https://github.com/shopware/shopware
- https://www.shopware.com/en/community/community-edition
- https://developer.shopware.com/docs/
