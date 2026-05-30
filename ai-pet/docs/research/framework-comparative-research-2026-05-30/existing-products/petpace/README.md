---
title: PetPace 产品调研
description: PetPace 医疗级 AI 智能项圈对 AI Pet 健康解释、安全边界和 telehealth 模式的启发。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - market-product
  - real-pet
  - health-monitoring
  - safety
source:
  - https://petpace.com/
  - https://cats.petpace.com/what-is-the-petpace-v3-0-smart-collar-for-cats/
---

# PetPace

## 产品定位

PetPace 是更偏医疗级的智能健康项圈，强调 AI insights、near real-time alerts、24/7 telemedicine 和 licensed vets。它的定位不是普通 activity tracker，而是 vital signs + behavioral data + health programs。

## 可验证能力

官方页面呈现的能力包括：

- 生命体征：pulse、temperature/fever、respiration、HRV/stress。
- 行为和健康：posture、activity、sleep quality、pain score、wellness、health profile、fitness。
- 24/7 telemedicine，chat/video with licensed vets。
- Share with your vet。
- 专项 health programs，例如 epilepsy、heart health、arthritis、pregnancy。

猫项圈介绍强调 temperature、pulse、respiration、HRV，且用 AI 追踪生命体征、活动和压力指标。

## 对 AI Pet 的启发

PetPace 说明高价值健康数据不是“给用户看一堆数”，而是要进入专业解释链路：

- 异常趋势如何解释。
- 哪些信号需要观察。
- 什么时候建议联系兽医。
- 怎样把数据分享给兽医。

AI Pet 可以借鉴它的“证据摘要 + 就医边界”，但不能自称医疗级设备。

## 不适合照搬的地方

PetPace 的优势依赖硬件、订阅、telemedicine 和专业背书。AI Pet MVP 没有医疗级传感器，也没有兽医服务网络，因此不能承诺 pain detection、diagnosis、treatment。

## MVP 采用方式

MVP 可以模拟 PetPace 类字段，但文案应降级：

- `temperature_trend`
- `resting_pulse`
- `respiration_rate`
- `stress_proxy`
- `posture/activity/sleep`

输出只做“风险提示 + 建议观察 + 建议就医”，不做诊断。

