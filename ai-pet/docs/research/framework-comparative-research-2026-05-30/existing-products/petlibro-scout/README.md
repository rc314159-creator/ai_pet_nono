---
title: PETLIBRO Scout 产品调研
description: PETLIBRO Scout AI 摄像头对 AI Pet 多宠识别、视频事件和活动摘要的启发。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - market-product
  - real-pet
  - camera-adapter
source:
  - https://petlibro.com/products/scout-smart-camera
  - https://petlibro.com/pages/scout-smart-camera
---

# PETLIBRO Scout

## 产品定位

PETLIBRO Scout 是 AI 宠物摄像头，重点不只是看直播，而是“认识多只宠物、标注活动、生成摘要和 highlight reel”。

## 可验证能力

官方产品页/专题页呈现：

- AI multi-pet recognition。
- 自动标注和组织宠物活动，例如 eating、drinking。
- 每只宠物活动摘要。
- shareable highlight reel。
- 90-day Video Cloud AI voucher 等云 AI 权益。

## 对 AI Pet 的启发

Scout 说明视频证据可以成为真实宠物关联主线的重要输入：

- 多宠识别解决“数据属于哪只宠物”。
- 吃喝行为可自动变成照护记录。
- highlight reel 可变成“今日宠物日记”。
- 活动摘要可驱动桌宠气泡：“我今天喝水比平时少”。

## 不适合照搬的地方

摄像头 AI 对隐私、云存储和识别准确率要求高。MVP 不应做视频识别主路径，也不应承诺摄像头自动判断健康。

## MVP 采用方式

先定义 `VideoEvent` mock：

- `pet_id`
- `event_type`: eating / drinking / play / rest / scratching
- `confidence`
- `clip_ref`
- `timestamp`

在 demo 中可用静态事件模拟 Scout 类能力。

