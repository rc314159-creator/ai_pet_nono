---
title: FitBark 产品调研
description: FitBark Developer API 对 AI Pet 真实设备接入和健康数据 adapter 的启发。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - market-product
  - real-pet
  - health-adapter
source:
  - https://www.fitbark.com/dev/
  - https://help.fitbark.com/en/collections/3873135-developer-api
---

# FitBark

## 产品定位

FitBark 是狗健康、活动和睡眠监测设备。与很多只提供 App 的设备不同，FitBark 有官方 Developer API 页面，明确说 API 可让开发者把 FitBark 数据集集成到第三方移动或 Web 应用。

## 可验证能力

官方 Developer API 页面说明：

- FitBark API 用于把 FitBark data sets 集成到第三方应用。
- 提供 API FAQ、API endpoints、API terms 和申请入口。
- API 目标是扩展和增强 FitBark 用户体验，支持协作的狗健康生态。

帮助中心的 Developer API collection 还涉及 Sleep Score、Health Index、Calorie Expenditure 是否可通过 API 获取等问题。

## 对 AI Pet 的启发

FitBark 是 AI Pet 第二阶段“真实设备接入验证”的首选候选之一，因为它有明确开发者入口。可映射字段：

- dog profile。
- activity totals。
- sleep/rest。
- goals。
- health index / sleep score / calories。

这些字段足以驱动：

- 今日运动任务。
- 睡眠异常观察。
- 宠物状态机中的 energy / mood / fitness trend。
- 与相似品种/年龄目标对比的解释。

## 不适合照搬的地方

FitBark 数据仍属于厂商生态，需要申请 API key、遵守 API terms，并处理授权和隐私。MVP 不应等待 API 审核，而应先实现 `HealthAdapter` 接口和 mock 数据。

## MVP 采用方式

先设计 `FitBarkLikeAdapter` 的数据契约，不接真实服务：

- `activity_total`
- `sleep_score`
- `health_index`
- `goal_progress`
- `dog_profile`

第二阶段再申请 API 验证真实接入。

