---
title: 开源电商项目调研
description: 2026-05-30 对主流开源/源码可见电商底座的分项目调研，用于 AI Pet 后续宠物用品、库存、订阅与推荐闭环选型。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
update_reason: 用户要求调研开源电商项目并写入知识库
related:
  - ai-pet/docs/plan/mvp-scope.md
  - ai-pet/docs/research/pet-community-ai-ecosystem/mvp-opportunities.md
---

# 开源电商项目调研

调研时间：2026-05-30 11:13 CST  
调研口径：优先查官方站点、官方文档、GitHub 仓库、许可证文件和 release 信息。GitHub stars、forks、最新 release、push 时间来自 2026-05-30 的 GitHub API 快照；项目定位和能力来自官方 README/文档/官网。  
目标场景：AI Pet 不是第一版就做完整商城，而是未来把“真实宠物档案、健康任务、库存提醒、宠物用品推荐、订阅补货、轻量社区挑战”连成商业闭环。

## 总体结论

1. 如果 AI Pet 要自建宠物用品交易闭环，首选调研对象是 Medusa、Saleor、Vendure、Spree。它们都是 API/headless 或 composable 方向，适合把推荐、库存、任务、会员和订阅逻辑接入桌宠弹出的应用窗口与桌宠提示。
2. 如果目标是最快做内容+商品转化，WooCommerce 是最低落地成本选择：WordPress 内容生态、插件和 REST API 很强，但长期会把业务逻辑带进 WordPress/PHP 生态。
3. 如果要做复杂 B2B/多仓/多供应商，Aimeos、nopCommerce、Shopware、Magento Open Source 都值得继续看，但它们更重，第一版不应作为 MVP 阻塞项。
4. Bagisto 是 Laravel 生态里上手和扩展性较好的选项，适合 PHP/Laravel 团队；对当前 AI Pet 的 TypeScript/React 栈不是最顺。
5. Broadleaf Commerce CE 和 Reaction Commerce 需要单独警惕：Broadleaf CE 明确是 source-available/fair-use，不是普通 OSI 开源；Reaction/Mailchimp Open Commerce 仓库已标注 discontinued，不应作为新项目底座。

## 证据等级

| 等级 | 含义 |
|---|---|
| A | 官方仓库/官网/文档直接可验证，且 2026 仍有 release 或代码活动 |
| B | 官方可验证但许可证、商业版边界或技术栈复杂度需要进一步评审 |
| C | 历史项目、源码可见但维护/许可证/产品路线存在明显风险 |

## 项目矩阵

| 项目 | 技术栈 | 形态 | 许可证/边界 | 2026 活跃度 | AI Pet 适配 | 记录 |
|---|---|---|---|---|---|---|
| Medusa | TypeScript / Node | headless commerce framework | MIT | 高 | 最高 | [medusa.md](medusa.md) |
| Saleor | Python / GraphQL | API-only composable commerce | BSD-3-Clause | 高 | 高 | [saleor.md](saleor.md) |
| Vendure | TypeScript / NestJS / GraphQL | plugin-first headless commerce | GPLv3 或商业许可 | 高 | 高但需法务 | [vendure.md](vendure.md) |
| Spree Commerce | Ruby on Rails + Next.js storefront | headless commerce platform | BSD-3-Clause | 高 | 中高 | [spree.md](spree.md) |
| WooCommerce | WordPress / PHP | CMS commerce plugin | GPLv3 | 高 | 中高 | [woocommerce.md](woocommerce.md) |
| Bagisto | Laravel / Vue | Laravel ecommerce framework | MIT | 高 | 中 | [bagisto.md](bagisto.md) |
| Aimeos | Laravel / PHP | package/headless/full shop | MIT for Laravel package | 高 | 中 | [aimeos.md](aimeos.md) |
| Sylius | PHP / Symfony / API Platform | ecommerce framework | MIT | 高 | 中 | [sylius.md](sylius.md) |
| Shopware 6 | PHP / Symfony / Vue | open headless commerce platform | MIT | 高 | 中 | [shopware.md](shopware.md) |
| PrestaShop | PHP / Symfony | traditional ecommerce platform | OSL-3.0/AFL-3.0 | 高 | 中低 | [prestashop.md](prestashop.md) |
| Magento Open Source | PHP | enterprise-grade commerce | OSL-3.0/AFL-3.0 | 高 | 中低 | [magento-open-source.md](magento-open-source.md) |
| nopCommerce | ASP.NET Core / C# | full shopping cart | NPL/AGPLv3 + attribution | 高 | 中低 | [nopcommerce.md](nopcommerce.md) |
| OpenCart | PHP | traditional shopping cart | GPLv3 | 中高 | 低 | [opencart.md](opencart.md) |
| Apache OFBiz | Java / Groovy | ERP + ecommerce suite | Apache-2.0 | 高 | 低但可参考 ERP | [apache-ofbiz.md](apache-ofbiz.md) |
| Solidus | Ruby on Rails | ecommerce framework | BSD-like Spree license | 高 | 中 | [solidus.md](solidus.md) |
| Broadleaf Commerce CE | Java / Spring | enterprise ecommerce framework | source-available/fair-use | 中 | 低，许可证风险 | [broadleaf-commerce.md](broadleaf-commerce.md) |
| Reaction Commerce | Node / GraphQL / MongoDB | discontinued headless commerce | GPLv3 | 低 | 不建议 | [reaction-commerce.md](reaction-commerce.md) |

## AI Pet 选型建议

### 第一优先：Medusa

Medusa 与当前项目的 React/TypeScript 方向最接近，模块化 commerce primitives 可以承接商品、库存、订单、支付、订阅和 marketplace 自定义。它的 MIT 许可证和 Node 生态降低了二次开发摩擦。若 AI Pet 第二阶段要做“宠物用品推荐 + 库存提醒 + 订阅补货 + checkout”，Medusa 是最值得做 PoC 的底座。

### 第二优先：Saleor 或 Vendure

Saleor 的 GraphQL/API-only 模型适合多渠道、服务化和强前端团队；缺点是 Python/Django 生态和 GraphQL 运维会引入新栈。Vendure 的 TypeScript/NestJS/GraphQL 体验对本项目很友好，插件系统也适合“宠物档案驱动的定制 commerce”，但 GPLv3/商业授权必须先确认。

### 第三优先：WooCommerce

如果短期目标是内容、商品、联盟转化或小规模宠物用品店，WooCommerce 可以最快上线。它适合“宠物知识内容 + 商品推荐 + 少量订单”，不适合作为长期高自定义 commerce engine。

### 暂不作为 MVP 主线

Magento、Shopware、PrestaShop、nopCommerce、OFBiz 更像成熟电商/ERP平台，能力足但部署、定制和运维都重。AI Pet 第一版没有必要让它们成为主系统。Broadleaf 和 Reaction 只作为行业参考，不作为候选底座。

## 对 AI Pet 产品的落地启发

- 第一版继续坚持“不做完整商城”，只做库存、任务和推荐解释：推荐必须说明与宠物档案、健康禁忌、年龄阶段、消耗周期或任务的关系。
- 商品模型至少预留：`species`、`life_stage`、`health_constraints`、`allergen_flags`、`consumable_cycle_days`、`inventory_threshold`、`subscription_candidate`。
- 订单模型后续要能链接 `CareTask` 和 `CareEvent`，例如“皮肤观察任务触发洗护用品推荐”或“粮食剩余 7 天触发补货提醒”。
- 不做自动购买。交易闭环应从“可解释推荐 -> 用户确认 -> checkout”开始。
- 如果选 Medusa/Vendure/Saleor，AI 推荐逻辑应作为独立服务或插件，不应写死在 storefront。

## 来源

- GitHub API 快照：2026-05-30 对各项目仓库的 stars、forks、release、push 时间查询。
- Medusa GitHub 与文档：https://github.com/medusajs/medusa 、https://docs.medusajs.com/learn/fundamentals/modules/commerce-modules
- Saleor 官网与 GitHub：https://saleor.io/open-source 、https://github.com/saleor/saleor
- Vendure 官网与 GitHub：https://vendure.io/product/core 、https://github.com/vendurehq/vendure
- 其余项目来源见各项目独立记录。
