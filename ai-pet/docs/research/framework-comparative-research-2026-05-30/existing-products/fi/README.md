---
title: Fi Series 3+ 产品调研
description: Fi Series 3+ AI 狗项圈对 AI Pet 行为识别、健康记录和订阅硬件模式的启发。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - market-product
  - real-pet
  - health-adapter
source:
  - https://support.tryfi.com/hc/en-us/articles/40961975299859-Upgrade-to-the-Fi-Series-3
  - https://apps.apple.com/us/app/fi-gps-dog-tracker/id1438036784
---

# Fi Series 3+

## 产品定位

Fi 是 GPS 狗项圈和健康追踪产品。Series 3+ 强调更快 GPS、Apple Watch、AI-powered behavior tracking 和 AI-organized vet records。

## 可验证能力

官方升级页说明：

- Series 3+ 提供 2x faster and more accurate GPS tracking。
- Apple Watch 可查看 location and activity data。
- AI Behavior Tracking 检测 steps、sleep、barking、licking、scratching、eating、drinking。
- AI Vet Records 可上传健康文档并组织/总结。
- 电池官方比较表写 3 months。
- 防水 IP68 和 IP66K。

## 对 AI Pet 的启发

Fi 的价值在“行为事件识别”：

- 吃饭/喝水可以直接触发照护记录。
- 吠叫、舔舐、抓挠可以触发异常观察。
- 睡眠和 steps 可以影响 energy/mood/fitness trend。
- vet records 可以进入宠物档案，变成 AI 问答上下文。

## 不适合照搬的地方

Fi 是狗项圈，不适合猫和所有宠物；真实体验会受 GPS、蜂窝网络、订阅、佩戴舒适度影响。MVP 不应绑定某个厂商设备。

## MVP 采用方式

在 mock 数据里加入行为事件流：

- `barking_count`
- `licking_events`
- `scratching_events`
- `eating_events`
- `drinking_events`
- `sleep_segments`

并把“AI vet records”抽象为 `PetDocument`：疫苗、病历、用药、过敏、兽医建议。

