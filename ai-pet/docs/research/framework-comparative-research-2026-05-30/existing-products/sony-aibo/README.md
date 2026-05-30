---
title: Sony aibo 产品调研
description: Sony aibo 云记忆、成长、食物/硬币系统对 AI Pet 长期关系和云依赖边界的启发。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - market-product
  - robot-pet
  - memory
source:
  - https://www.sony.com/electronics/support/articles/00249669
---

# Sony aibo

## 产品定位

aibo 是 Sony 的机器人狗，核心价值是具身陪伴、云端记忆、成长和 app 联动。它是纯电子宠物主线的高端实体形态。

## 可验证能力

Sony 支持页说明，如果 aibo AI Cloud Plan 不续费：

- aibo 的成长会停止。
- aibo 不再记住人、地点、事物，也不能理解主人命令。
- 云端 memories、settings、照片、地点、与主人的记忆会消失。
- My aibo app 的通信功能、tricks、地图、设置等不可用。
- coins、foods、软件更新、季节行为都会受影响。

## 对 AI Pet 的启发

aibo 最重要的启发不是机器人硬件，而是“长期关系需要记忆和成长”：

- 宠物记住主人。
- 宠物记住地点和事件。
- 食物/硬币/道具进入关系系统。
- app 和宠物本体共同构成体验。

这也提醒我们：云记忆是强价值，但一旦依赖云，用户会关心数据归属、迁移和续费后果。

## 不适合照搬的地方

AI Pet MVP 没有机器人本体，也不应把核心记忆锁死在不可导出的云计划里。尤其在比赛/demo 中，必须保证离线/mock 可演示。

## MVP 采用方式

实现轻量 `PetMemory`：

- 主人偏好。
- 宠物档案。
- 最近事件。
- 已完成任务。
- 重要健康记录。

并保证本地可见、可导出，避免 aibo 式云计划依赖成为 MVP 风险。

