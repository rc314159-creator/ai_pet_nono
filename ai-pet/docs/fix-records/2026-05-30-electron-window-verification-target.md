---
title: 2026-05-30 应用窗口验证目标误用浏览器问题记录
description: 记录“我的”页头像改动后只用浏览器 localhost 截图验证，而用户指出实际展示目标是 Electron 应用窗口的问题。
status: 已批准
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
domain_taxa:
  - app-window
  - electron-runtime
  - frontend-ui
related:
  - ../plan/implementation-log-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../product/product-spec-2026-05-30.md
---

# 2026-05-30 应用窗口验证目标误用浏览器问题记录

## 事实时间线

- 本轮按用户要求，把“我的”页顶部头像替换为 llmmelon 生成的柯基头像，并把页面显示名改为“旺财”。
- 代码层改动发生在 React/Vite renderer 中，该 renderer 同时被浏览器开发地址和 Electron 应用窗口加载。
- 上轮验证主要使用 in-app browser 打开 `http://127.0.0.1:5180/`，截图为浏览器页面。
- 用户随后指出“我们的页面是这个。不是 html”，并提供 macOS Dock 中 Electron 应用图标截图，强调最终展示对象是 Electron 应用窗口。

## 证据

- `desktop-app/main.cjs` 创建 `430x932` Electron `BrowserWindow`，默认加载 `http://127.0.0.1:5180`。
- 当前进程列表存在 `/Users/rencan/ai-pet-system/ai-pet/node_modules/electron/dist/Electron.app/... /desktop-app/main.cjs`。
- 用户截图显示当前操作对象是 Electron 应用，而不是浏览器标签页。
- 项目产品规格明确应用窗口可以用 React/Vite 渲染，但产品口径必须是“应用窗口/功能面板”，不是 HTML 展示页。

## 根因

- 把 renderer 技术实现和最终产品载体混在一起描述，导致验证报告给人的感觉是“改了一个网页/HTML 页面”。
- 上轮虽然改的是 Electron 会加载的共享 renderer，但最终验证没有落到 Electron 窗口本体。
- 汇报时没有明确区分“浏览器 localhost 只是开发调试入口”和“真实展示目标是 Electron 应用窗口”。

## 修复计划

1. 后续应用窗口 UI 改动，浏览器 localhost 只作为 renderer smoke test。
2. 最终验收必须打开或聚焦 Electron `desktop-app` 窗口，在 Electron 应用中操作目标页面。
3. 验证记录和最终回复统一称为 Electron 应用窗口/应用窗口，不称为 HTML 页面。
4. 对本次“旺财”头像改动追加 Electron 窗口截图验证。

## 修复结果

- 已将 `PetProfile.avatar.profileImageUrl` 从 `/assets/pets/mochi/wangcai-profile-avatar-v1.png` 改为 `assets/pets/mochi/wangcai-profile-avatar-v1.png`，避免 Electron `file://dist/index.html` 下绝对路径解析到文件系统根目录。
- 已重新执行 `npm run typecheck` 和 `npm run build`。
- 已重启 `AI_PET_LOAD_DIST=1 npm run dev:app`，在 Electron 应用窗口中进入“我的”页，确认显示名为“旺财”、头像为生成柯基图。
- Electron 窗口验证截图：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/electron-wangcai-my-profile.png`。
