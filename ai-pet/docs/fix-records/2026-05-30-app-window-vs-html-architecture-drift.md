---
title: 2026-05-30 应用窗口被误当成前端 HTML 与实际 App 架构记录不足问题记录
description: 记录多次把 Electron 应用窗口/桌宠运行时误描述或误验证为前端 HTML 的复发问题，并回补实际运行架构到知识库。
status: 已批准
created: 2026-05-30
updated: 2026-05-30
update_reason: 用户指出此前修改反复偏向前端 HTML，没有按桌面 App 目标执行，要求明确问题根因并把实际架构写入知识库。
doc_type: fix-record
related:
  - ../architecture/technical-architecture-2026-05-30.md
  - ../knowledge-base/project-directory-map-2026-05-30.md
  - 2026-05-30-electron-window-verification-target.md
  - 2026-05-30-electron-app-avatar-and-desktop-pet-visibility.md
---

# 应用窗口被误当成前端 HTML 与实际 App 架构记录不足问题记录

## 事实时间线

- 2026-05-30 早期实现和验证中，曾产出 `reports/desktop-pet-avatar-demo/index.html`、历史 HTML 看板和浏览器 `localhost` 截图。这些只能作为原型或验证材料，不是当前产品形态。
- 2026-05-30 用户多次纠偏：目标不是前端 HTML，也不是静态网页展示页；目标是系统级桌宠，点击桌宠后弹出桌面 App 应用窗口。
- 2026-05-30 后续 docs 已在产品规格、技术架构和多个 fix-record 中写入“项目没有 HTML 展示页”“应用窗口是 Electron 应用窗口”。但该约束仍然复发，说明知识库没有把“实际运行入口、目录职责、验证目标”收敛成足够硬的架构事实。
- 2026-05-30 当前代码事实是：`npm run dev` 默认同时启动 API、Vite renderer 和 `desktop-photo-pet`；`desktop-photo-pet/main.cjs` 在同一个 Electron 进程内创建透明桌宠窗口和点击后应用窗口；`desktop-app/main.cjs` 只是 standalone 应用窗口调试入口。

## 证据引用

- `package.json`：`dev` 脚本为 `api + renderer + photo-pet`，`dev:photo-pet` 执行 `electron desktop-photo-pet/main.cjs`。
- `desktop-photo-pet/main.cjs`：`createPetWindow()` 创建透明、置顶、跳过任务栏的桌宠窗口；`createAppWindow()` 创建约 `430x932` 的应用窗口；点击桌宠通过 IPC 打开应用窗口，并在应用窗口打开/关闭时隐藏/恢复桌宠。
- `desktop-app/main.cjs`：只创建应用窗口，加载 `127.0.0.1:5180` 或 dist，不创建桌宠窗口，不能验证桌宠显隐联动。
- `desktop-photo-pet/renderer.html` 和 `dist/index.html`：是 Electron `BrowserWindow` 加载的 renderer 文件，不等同于产品是 HTML 页面。
- `docs/INDEX.md`、`product/product-spec-2026-05-30.md`、`architecture/technical-architecture-2026-05-30.md` 已写明项目没有 HTML 展示页，但目录地图仍存在“`desktop-app/` 是当前应用窗口端入口、`desktop-photo-pet/` 由另一条开发线处理”的过时表述，容易让执行继续偏到 standalone renderer 或浏览器验证。

## 根因

根因不是“前端”和“桌面 App”技术上不能共存。Electron App 本来就可以用 React/Vite/HTML/CSS 做 renderer。真正的问题是把 renderer 技术栈误当成产品交付形态，把 `localhost` 浏览器验证和 HTML 报告当成最终 App 验证。

具体问题：

1. 知识库虽然写了产品口径，但缺少一段不可歧义的“当前实际运行架构”：默认入口、窗口进程、每个目录职责、哪些 HTML 只是 renderer/历史报告。
2. 计划和修复记录写得多，架构 spec 和目录地图没有及时吸收最新事实，导致知识库真相源和代码运行入口之间有漂移。
3. 验证标准没有足够硬：应用窗口 UI 可以先用浏览器做 renderer smoke test，但最终结论必须落在 Electron 应用窗口；桌宠联动必须用 `desktop-photo-pet` 集成入口验证。
4. `reports/` 下历史 HTML 产物没有被足够明确地隔离为“历史验证材料”，使后续执行仍可能把项目误做成网页看板或 HTML demo。

## 修复计划

1. 回补 `architecture/technical-architecture-2026-05-30.md`：新增“当前实际运行架构”作为执行入口真相源，明确 `desktop-photo-pet` 是当前完整 App 入口，`desktop-app` 只是 standalone 调试入口。
2. 修正 `knowledge-base/project-directory-map-2026-05-30.md`：把 `desktop-app/`、`desktop-photo-pet/`、`src/`、`reports/` 的真实职责写清楚，避免把 renderer 目录理解成网页产品。
3. 更新 `docs/INDEX.md` 和根级 `docs/INDEX.md`：把本记录加入修复记录入口。
4. 后续任何涉及应用窗口或桌宠的验证，必须优先说明验证对象：完整产品链路用 `npm run dev` / `desktop-photo-pet`；standalone `desktop-app` 只用于应用窗口调试；浏览器只用于 renderer smoke test。

## 当前结论

前端 renderer 和桌面 App 不矛盾；矛盾发生在执行和表达层：把 renderer 当成产品、把浏览器当成验收目标、把 HTML 报告当成交付目标。当前项目实际架构必须按“Electron 桌宠进程 + Electron 应用窗口 + React/Vite renderer + Express API + shared domain/agent tools”理解。
