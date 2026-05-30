---
title: Petivity 产品调研
description: Petivity 智能猫砂盆监测对 AI Pet 排泄、体重、月报和兽医证据链的启发。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - market-product
  - real-pet
  - health-monitoring
source:
  - https://www.petivity.com/products/smart-litter-box-monitor
  - https://www.purina.com/petivity-smart-litter-box-monitor
---

# Petivity

## 产品定位

Petivity 是猫砂盆健康监测系统，用 AI 追踪猫每次使用猫砂盆时的体重、排尿、排便事件，并提供月报和关键变化提醒。

## 可验证能力

官方页面呈现：

- Track cat’s daily and long-term weight changes。
- Monitor daily litter box habits。
- Ask AI chat questions about cat health。
- Receive monthly reports you can take to your vet。
- Get alerted to key changes important to cat health。
- AI technology tracks weight, urination, defecation events.

## 对 AI Pet 的启发

Petivity 说明真实宠物健康不只来自项圈。对猫来说，排泄和体重非常关键：

- 体重趋势可进入 fitness / health flags。
- 排尿/排便频率可触发风险观察。
- 月报可以成为兽医沟通材料。
- AI chat 要围绕具体宠物历史数据，而不是泛百科。

## 不适合照搬的地方

Petivity 只覆盖猫砂盆场景，对狗和非猫宠物不适用。MVP 不应把设备类型写死，而应把它抽象为 `LitterBoxAdapter` 或 `EliminationEvent`。

## MVP 采用方式

在 mock 数据里加入：

- `weight_kg`
- `urination_count`
- `defecation_count`
- `litter_box_visit`
- `change_from_baseline`

让 AI 生成“连续异常建议就医”的安全提醒。

