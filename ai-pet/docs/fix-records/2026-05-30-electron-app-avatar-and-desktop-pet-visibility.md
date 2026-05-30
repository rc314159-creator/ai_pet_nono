---
title: 2026-05-30 Electron 应用窗口宠物形象与桌宠显隐联动问题记录
description: 记录应用窗口三处宠物形象仍为程序化 CSS mock、standalone Electron 入口与桌宠集成入口混用、以及应用窗口打开/关闭时桌宠未隐藏/恢复的问题。
status: 已修复
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
related:
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../plan/implementation-log-2026-05-30.md
---

# Electron 应用窗口宠物形象与桌宠显隐联动问题记录

## 事实时间线

- 2026-05-30，用户要求应用窗口内三处宠物形象使用第四张截图中的照片级 Mochi 动态形象：对话页背景宠物、状态页状态卡宠物、我的装扮页大预览宠物。
- 用户同时要求：打开应用窗口时桌面上的宠物消失，关闭应用窗口时桌宠重新出现。
- 初始检查确认：`src/App.tsx` 的 `PetFigure` 仍用 CSS DOM 绘制程序化柯基；应用窗口内不是读取 `public/assets/pets/mochi/motions/manifest.json` 的照片级动作帧。
- 初始检查确认：`desktop-photo-pet/main.cjs` 可以点击桌宠打开应用窗口，但没有在应用窗口生命周期里隐藏/恢复桌宠窗口。
- 验证过程中用户纠正：“我们的页面是 Electron，不是 html”。随后确认：视觉验证可以用 renderer 辅助，但最终结论必须在实际 Electron 窗口中验证。
- 进一步检查确认：默认 `npm run dev` 仍启动 standalone `desktop-app/main.cjs` + OpenPets，而不是照片级桌宠集成入口；这会让用户看到 Dock 里的单独 Electron 窗口，却无法验证桌宠显隐联动。

## 证据引用

- 程序化形象来源：`src/App.tsx` 原 `PetFigure` 函数由 `.pet-body`、`.pet-head`、`.pet-tail` 等 DOM/CSS 组成。
- 照片级动作包来源：`public/assets/pets/mochi/motions/manifest.json`，当前包含待机、走路、蹦跳、回头、转身、坐下、提醒、警觉等多帧动作。
- 桌宠集成入口：`desktop-photo-pet/main.cjs`，同一 Electron 进程内创建透明桌宠窗口和应用窗口。
- standalone 调试入口：`desktop-app/main.cjs`，只创建应用窗口，不能直接控制 `desktop-photo-pet` 的桌宠窗口。

## 根因

- 应用窗口内的宠物视觉没有复用桌宠 motion pack，导致三处页面和真实桌宠不是同一形象来源。
- 桌宠窗口和应用窗口虽然在 `desktop-photo-pet` 中同属一个 Electron 进程，但创建应用窗口时没有调用 `petWindow.hide()`，应用窗口关闭时也没有恢复桌宠。
- 默认开发命令混用了 standalone 应用窗口和桌宠进程，导致验证对象容易偏离真实产品形态。

## 修复计划

1. 新增 React 端照片级 Mochi 动作帧组件，读取同一份 motion manifest 和透明帧素材。
2. 将对话页、状态页、我的装扮页大预览切换到该组件。
3. 在 `desktop-photo-pet/main.cjs` 的应用窗口生命周期中实现 `hide/show` 桌宠。
4. 调整默认开发命令，让 `npm run dev` 启动 API、renderer 和照片级桌宠集成入口。
5. 用实际 Electron 窗口验证显隐联动和三处页面视觉，不以浏览器页面作为最终证据。

## 修复

- 新增 `src/components/MochiMotionAvatar.tsx`：
  - 读取 `assets/pets/mochi/motions/manifest.json`。
  - 按 `fps` 和 `frames` 用 `requestAnimationFrame` 播放透明帧。
  - 将 UI 状态和 agent 动作命令映射到 motion pack 中的动作。

- 更新 `src/App.tsx`：
  - `PetFigure` 改为委托 `MochiMotionAvatar`。
  - 对话页、状态页、我的装扮页大预览自动使用同一套照片级 Mochi 动作帧。

- 更新 `src/styles.css`：
  - 为 `.mochi-motion-avatar` 和 `.mochi-motion-frame` 设置稳定尺寸、透明帧 object-fit 和投影。
  - 调整对话页、状态页、我的页预览尺寸，避免遮挡文本和底部导航。

- 更新 `desktop-photo-pet/main.cjs`：
  - 创建或聚焦应用窗口时调用 `petWindow.hide()`。
  - 应用窗口关闭时调用 `petWindow.showInactive()` 并恢复置顶。

- 更新 `package.json`：
  - 默认 `npm run dev` 改为启动 `api + renderer + photo-pet`。
  - 保留 `dev:openpets-app` 用于旧的 OpenPets + standalone 应用窗口调试。

## 验证

- `node --check desktop-photo-pet/main.cjs && node --check desktop-photo-pet/preload.cjs && node --check desktop-photo-pet/runtime.js` 通过。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- Browser renderer 辅助验证：
  - 对话页、状态页、我的页大预览均显示照片级 Mochi。
  - Playwright console 检查：0 errors，0 warnings。
  - `assets/pets/mochi/motions/manifest.json` 请求返回 200。
- Electron 实际验证：
  - 启动 `npm run dev` 后先显示 `AI Pet Photo Desktop Pet` 照片级桌宠。
  - 点击桌宠打开 `AI Pet Digital Twin MVP` Electron 应用窗口，桌宠窗口从屏幕上消失。
  - 对话页顶部背景宠物显示照片级 Mochi 动作帧。
  - 状态页状态卡宠物显示照片级 Mochi 动作帧。
  - 我的装扮页大预览宠物显示照片级 Mochi 动作帧。
  - 点击应用窗口关闭按钮后，`AI Pet Photo Desktop Pet` 桌宠窗口重新出现。

## 剩余注意

- `desktop-app/main.cjs` 仍保留为 standalone 应用窗口调试入口；验证桌宠显隐联动时不能使用该入口。
- 当前应用窗口内照片级动作帧是视觉同步，真实桌宠动作命令仍由 `desktop-photo-pet/runtime.js` 轮询 `/api/desktop-pet/motion` 消费。
