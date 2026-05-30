---
title: Casio Moflin 产品调研
description: Moflin 情绪 AI 机器人宠物对 AI Pet 纯电子宠物主线、情绪地图和非语言陪伴的启发。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - market-product
  - virtual-pet
  - emotional-ai
source:
  - https://www.casio.com/us/moflin/
---

# Casio Moflin

## 产品定位

Moflin 是 Casio 的 AI companion / robot pet，主打“像生命体一样有情绪的陪伴”。它不是服务真实宠物，而是服务人的压力缓解、孤独陪伴和非语言情感连接。

## 可验证能力

官方页面呈现：

- emotional AI，能响应、理解、成长。
- 情绪谱：joy、curiosity、relaxation、loneliness 等。
- 互动越丰富，情绪越动态演化。
- 抚摸、拥抱、说话会带来积极情绪；忽视或惊吓会带来负面情绪。
- Day 1 / Day 25 / Day 50 的成长路径：情绪丰富、依恋开始、反应更清晰。
- MofLife app 可查看当前 feelings 和 past interactions。
- 规格包括 microphone、illuminance sensor、touch sensors、accelerometer/gyroscope、speaker、2-axis movement。

## 对 AI Pet 的启发

Moflin 对纯电子宠物主线非常重要。它说明“陪伴”不必依赖大量语言，反而可以通过：

- 情绪地图。
- 触摸反馈。
- 被忽视后的状态变化。
- 长期依恋。
- 个体人格差异。

AI Pet 的纯电子宠物不应只是会说话，而要有被照顾、被忽视、被互动后的状态变化。

## 不适合照搬的地方

Moflin 是硬件机器人，成本、供应链和售后复杂。AI Pet 第一版不应做实体机器人，也不应承诺真实情绪，只应表述为模拟情绪和状态。

## MVP 采用方式

把 Moflin 的情绪谱降维成软件状态：

- `calm`
- `curious`
- `happy`
- `lonely`
- `anxious`
- `tired`

并用桌宠动作、气泡和任务提示表现，而不是硬件动作。

