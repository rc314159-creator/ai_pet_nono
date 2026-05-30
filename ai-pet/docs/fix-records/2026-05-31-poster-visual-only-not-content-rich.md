---
title: AI Pet 海报初稿误做成主视觉而非图文丰富项目海报问题记录
description: 记录 A4 海报生成过程中信息密度、图文结构和用户意图理解偏差。
status: 修复中
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - poster
  - design-output
  - demo-communication
related:
  - ../product/product-spec-2026-05-30.md
  - ../architecture/product-logic-framework-2026-05-31.md
  - ../architecture/current-system-architecture-2026-05-30.md
---

# AI Pet 海报初稿误做成主视觉而非图文丰富项目海报问题记录

## 事实时间线

- 2026-05-31，用户要求“为项目生成一个海报”，并明确海报为正常 A4 纸大小，同时需要“应该提供什么参考图片，以及生成什么样的提示词交给深度模型去生成”。
- 助手先给出参考图和提示词，并在用户补充“你这边也去做啊”后生成了一张 A4 竖版主视觉图。
- 生成结果文件为 `reports/posters/ai-pet-a4-poster-final-cn.png`，主体是写实柯基、半透明应用窗口和少量标题/卖点。
- 用户反馈“这是海报呀，是文字丰富的海报呀，图片文字都丰富，内容充实”，说明初稿没有满足“图文丰富、信息充分、可展示项目内容”的真实目标。

## 证据引用

- 初稿输出：`reports/posters/ai-pet-a4-poster-final-cn.png`。
- 初稿无字主视觉：`reports/posters/ai-pet-a4-poster-visual-base.png`。
- 当前项目产品真相：AI Pet 不是普通网页或单纯宠物 App，而是“系统级桌宠 + 点击后应用窗口 + AI 陪伴/真实宠物数字分身 + 状态/任务/奖励闭环”，见 `ai-pet/docs/product/product-spec-2026-05-30.md`。
- 当前项目架构真相：完整 Demo 是 `desktop-photo-pet` Electron 桌宠集成进程 + 应用窗口 + Agent runtime + Domain + Mochi 动作资产，见 `ai-pet/docs/architecture/current-system-architecture-2026-05-30.md`。

## 根因

- 对“海报”的理解错误地偏向了“产品主视觉 / launch key visual”，没有按项目汇报或 Demo 展示海报处理。
- 生图提示词刻意要求“no text”，只为后续本地叠标题预留空间，导致内容承载能力不足。
- 本地叠字只放了标题、短副标题和三个卖点，没有把产品闭环、模块、Demo 能力、技术路径和用户价值组织成图文信息层级。

## 修复计划

- 重新制作一版 A4 竖版“图文丰富项目海报”，信息结构至少包含：项目定位、核心闭环、关键能力、Demo 架构、使用场景和当前可运行能力。
- 视觉上保留真实小狗和应用窗口，但不再以大面积留白为主；改为“上方标题 + 中央产品图 + 多个信息模块 + 底部 Demo/技术能力条”的内容型海报。
- 生成给深度模型的提示词必须明确要求 rich editorial poster、dense but readable infographic layout、Chinese text areas，并禁止只生成单一主视觉。
- 若继续用生图模型生成底图，中文正文必须优先由本地排版叠加，避免模型生成乱码。
