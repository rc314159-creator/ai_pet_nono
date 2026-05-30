---
title: Furbo Nanny 产品卡
description: 已存在宠物摄像头与 AI Smart Alerts 产品记录。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
update_reason: 补齐现有产品逐项卡片
related:
  - ai-pet/docs/research/existing-pet-health-products-2026-05-30.md
---

# Furbo Nanny

- 来源：https://furbo.com/us/products/furbo-360-dog-camera
- 产品形态：Furbo 360 宠物摄像头和 Furbo Nanny 订阅能力，包含旋转摄像、投食、双向音频、视频记录和 Smart Alerts。
- 已存在证据：官网产品页展示购买入口和 AI-powered Furbo Nanny。
- AI 结合：通过 Smart Alerts 检测宠物活动和家庭异常事件，并把离家观察转为推送/视频摘要。
- 对 AI Pet 的启发：摄像头事件应抽象为 `CareEvent`，包含事件类型、证据片段、置信度、是否需要主人行动。桌宠可以表达“我刚看到它吐了/一直叫/有人靠近”这类低延迟提醒。
- 风险：强依赖订阅、摄像头隐私和识别准确率；不能把摄像头事件直接解释成疾病诊断。

