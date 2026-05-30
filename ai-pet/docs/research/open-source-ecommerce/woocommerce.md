---
title: WooCommerce 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: A
---

# WooCommerce

## 基本信息

- 仓库：https://github.com/woocommerce/woocommerce
- 官网：https://woocommerce.com/
- REST API 文档：https://developer.woocommerce.com/docs/apis/rest-api/
- 技术栈：WordPress、PHP、React blocks/admin pieces。
- 许可证：GPLv3。
- GitHub 快照：10,317 stars、10,693 forks；最新 release `10.8.1`，发布于 2026-05-28；2026-05-30 仍有 push。
- 官方定位：built on WordPress 的 customizable open-source ecommerce platform。

## 能力拆解

- 架构：WordPress 插件，天然结合内容、CMS、SEO、主题、插件市场。
- 关键能力：商品、购物车、订单、支付、物流、税、订阅/会员/预约等扩展，REST API 和 webhooks。
- 生态：支付、物流、营销、CRM、广告、订阅、会员、移动 App 插件非常多。

## 对 AI Pet 的参考价值

- 如果 AI Pet 短期要做“宠物知识内容 + 商品卡 + 小规模订单”，WooCommerce 是最快的。
- REST API 可以让 AI Pet 控制台读取商品、库存、订单，也能把推荐跳转到 Woo checkout。
- WordPress 内容体系适合宠物健康科普、用品评测、SEO 增长。

## 风险与不足

- 自定义 commerce logic 容易落入 WordPress hooks/plugins 体系，长期工程边界会变复杂。
- 对“宠物档案驱动推荐、健康禁忌约束、AI 解释、订阅补货”这种深度业务模型，不如 Medusa/Vendure/Saleor 干净。
- GPLv3 需要确认二次分发边界；插件生态质量参差，需要逐个审查。

## 初步结论

最快可用的内容电商方案，不建议作为 AI Pet 的长期核心 commerce engine。适合第一阶段导购、联盟转化或小规模商店；若要做高度定制交易闭环，优先 Medusa。

## 来源

- https://github.com/woocommerce/woocommerce
- https://developer.woocommerce.com/docs/apis/rest-api/
- https://raw.githubusercontent.com/woocommerce/woocommerce/trunk/plugins/woocommerce/readme.txt
