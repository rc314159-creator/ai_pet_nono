---
title: AI Pet 点击桌宠跳过“开始陪伴”初始页问题记录
description: 记录桌宠主入口默认打开 chat，导致欢迎/开始陪伴页无法从主链路进入的问题、根因、修复计划和验证结果。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - desktop-runtime
  - app-window
  - ui-channel
related:
  - ../product/product-spec-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - ../modules/INDEX.md
---

# 点击桌宠跳过“开始陪伴”初始页问题记录

## 事实时间线

- 2026-05-31，用户追问“‘开始陪伴’那个页面，怎么样能够进入到‘开始陪伴’那个页面？就是最初始的那个页面”。
- 代码检查发现，`src/App.tsx` 的默认初始视图是 `welcome`，但桌宠点击入口 `desktop-photo-pet/runtime.js` 写死调用 `openAppWindow("chat")`。
- 主进程 `desktop-photo-pet/main.cjs` 和 preload 默认值也使用 `chat`，导致从产品主入口点击桌宠时绕过欢迎页。
- 知识库中产品规格已写明“点击桌宠后应用窗口先进入欢迎/介绍初始页”，但技术架构和联动协议仍保留“默认进入陪伴对话页”的旧口径。

## 证据引用

- `src/App.tsx`：`readInitialAppView()` 在没有 URL `view` 参数时 fallback 到 `welcome`，且 `WelcomeView` 展示“开始陪伴”按钮。
- `desktop-photo-pet/runtime.js`：点击桌宠后的 `handlePointerUp()` 调用 `window.desktopPhotoPet?.openAppWindow("chat")`。
- `desktop-photo-pet/main.cjs`：`createAppWindow(targetView = "chat")` 和 IPC fallback 都会把无目标视图入口导向 `chat`。
- `docs/product/product-spec-2026-05-30.md`：当前产品规格要求点击桌宠先进入欢迎/开始陪伴初始页。
- `docs/architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md` 和 `docs/architecture/technical-architecture-2026-05-30.md`：修复前仍把“点击桌宠本体”默认目标写成 `chat`。

## 根因

产品规格已经更新为“桌宠主入口 -> 欢迎/开始陪伴 -> 陪伴对话”，但 Electron 桌宠点击链路和架构协议没有同步更新，形成代码与知识库双重漂移。结果是独立应用窗口或无 `view` 参数的 renderer 能显示欢迎页，而真实产品主入口点击桌宠却直接进入对话页。

## 修复计划

1. 将桌宠点击入口 `desktop-photo-pet/runtime.js` 从 `openAppWindow("chat")` 改为 `openAppWindow("welcome")`。
2. 将 `desktop-photo-pet/main.cjs` 和 `desktop-photo-pet/preload.cjs` 的默认目标视图从 `chat` 改为 `welcome`。
3. 将应用窗口 IPC 导航 fallback 从 `chat` 改为 `welcome`，并把 `ExpressionCommand.context.targetView` 类型补充 `welcome`。
4. 同步技术架构、桌宠联动协议和模块索引：默认无显式目标视图时进入欢迎/开始陪伴页；点击“开始陪伴”后进入 `chat`。
5. 执行构建和桌面 App 链路验证：点击桌宠应打开欢迎页，点击“开始陪伴”应进入对话页。

## 验证结果

- 已执行：`npm run build`，TypeScript、Vite renderer build、dist asset prune 和 server bundle 均通过。
- 已执行：重启 `desktop-photo-pet` Electron 桌宠进程后，点击桌宠打开应用窗口，实际 URL 为 `dist/index.html?view=welcome&build=...`，界面显示“毛球伙伴”和“开始陪伴”按钮。
- 已执行：点击“开始陪伴”后进入“旺财家庭群”陪伴对话页。
