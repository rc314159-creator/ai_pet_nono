---
title: Pumpkii BQ75 产品调研
description: Pumpkii 移动宠物摄像头机器人对 AI Pet 远程看护、移动互动和投食闭环的启发。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - market-product
  - real-pet
  - embodied-interaction
source:
  - https://pumpkii.com/pet-camera-treat-dispenser
  - https://www.pumpkii.com/
---

# Pumpkii BQ75

## 产品定位

Pumpkii BQ75 是移动宠物摄像头机器人，强调 2K live feed、远程驾驶找宠、投食、激光玩具和自动回充。它不是健康监测项圈，而是离家陪伴和远程互动硬件。

## 可验证能力

官方页面说明：

- 打开 Pumpkii app，查看 live 2K feed。
- 远程驱动机器人到宠物所在位置。
- 顶部容器约 200g 干粮/零食。
- 点击 treat button 发射零食。
- 产品线包含带 treat dispenser 和 laser toy 的宠物摄像头机器人。

## 对 AI Pet 的启发

Pumpkii 的关键价值是“行动闭环”：

- 用户不是只收到提醒，还能远程互动。
- 摄像头画面、移动位置和投食动作形成完整场景。
- 对分离焦虑、外出托管、上班时陪玩有明确价值。

AI Pet 可以把它抽象成“remote care action”：

- 看一眼宠物。
- 远程投喂。
- 发起玩耍。
- 记录反馈。

## 不适合照搬的地方

MVP 不应自研机器人硬件，也不应模拟不可执行的真实投喂。投食类动作需要安全确认，尤其是过敏、处方粮、肥胖、禁食状态。

## MVP 采用方式

用 mock action 表示“远程照护”：

- `remote_check_in`
- `treat_dispensed`
- `laser_play_session`
- `owner_video_seen`

这些事件可以影响宠物的 mood、fullness、friendship，但必须带人工确认。

