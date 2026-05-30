---
title: nopCommerce 调研记录
status: 起草中
created: 2026-05-30
updated: 2026-05-30
evidence_level: B
---

# nopCommerce

## 基本信息

- 仓库：https://github.com/nopSolutions/nopCommerce
- 官网：https://www.nopcommerce.com/
- 文档：https://docs.nopcommerce.com/
- 技术栈：ASP.NET Core、C#。
- 许可证：nopCommerce Public License，基本为 AGPLv3 + 每个 UI 页面保留 powered by nopCommerce 文本要求；可购买商业许可移除限制。
- GitHub 快照：10,074 stars、5,968 forks；最新 release `release-4.90.4`，发布于 2026-03-16；2026-05-28 仍有 push。
- 官方定位：free/open-source shopping cart，包含 catalog frontend 和 administration backend。

## 能力拆解

- 架构：完整购物车应用，含前台、后台、插件、主题。
- 关键能力：多店、多供应商、B2B/B2C、支付/物流、仓库管理、营销和 SEO、多币种多语言。
- 生态：适合 .NET 团队和企业级 Windows/.NET 基础设施。

## 对 AI Pet 的参考价值

- 多店、多供应商、多语言、多币种对宠物用品商城有参考价值。
- 如果未来客户是 .NET 生态宠物零售商，nopCommerce 可作为集成对象。
- 其许可证设计提醒 AI Pet：开源商业化要明确 UI attribution、商业许可和二次分发边界。

## 风险与不足

- .NET/C# 技术栈与当前项目不一致。
- NPL/AGPLv3 + attribution 对闭源产品和白标商业化不友好，需要法务评审。
- 完整购物车形态较重，不适合当前 MVP。

## 初步结论

中低优先级。功能成熟，但许可证和技术栈都不适合作为 AI Pet 当前底座。

## 来源

- https://github.com/nopSolutions/nopCommerce
- https://www.nopcommerce.com/en
- https://docs.nopcommerce.com/
- https://github.com/nopSolutions/nopCommerce/blob/develop/LICENSE.md
