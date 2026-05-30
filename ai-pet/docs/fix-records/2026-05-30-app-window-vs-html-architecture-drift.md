---
title: 2026-05-30 应用窗口被误当成前端 HTML 与实际 App 架构记录不足问题记录
description: 记录多次把 Electron 应用窗口/桌宠运行时误描述或误验证为前端 HTML 的复发问题，并回补实际运行架构到知识库。
status: 已批准
created: 2026-05-30
updated: 2026-05-31
update_reason: 追加复发记录：Codex in-app browser 停在 localhost renderer，被用户指出真实目标是桌面端宠物 App，必须补强 App 验收红线。
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

## 2026-05-31 复发记录：localhost renderer 被误当成 App

### 事实时间线

- 2026-05-31 上轮修复后，最终验证过程仍包含 Codex in-app browser 打开 `http://127.0.0.1:5180/?view=my` 的 renderer 页面。
- 提交后开发进程被关闭，浏览器页仍停留在 renderer 调试地址；用户随后问“我的 app 呢？为什么不能用啊？你在改 HTML 啊”，再次指出目标是桌面端宠物 App。
- 这说明知识库虽然写了“不是 HTML 展示页”，但还没有把“用户说 App 可用性时必须启动和验证 Electron 桌宠 App”写成足够硬的执行规则。

### 证据引用

- `ai-pet/package.json`：完整开发态入口是 `npm run dev`，同时启动 API、Vite renderer 和 `desktop-photo-pet`。
- `architecture/current-system-architecture-2026-05-30.md`：已补充 `App 验收红线`，规定浏览器 localhost 只能做 renderer smoke test。
- `architecture/technical-architecture-2026-05-30.md`：已补充 `App 可用性判断规则`，规定完整验收必须看到桌宠窗口、点击桌宠弹出应用窗口、关闭后恢复桌宠。

### 根因

上一版知识库把“产品不是 HTML”写成了产品口径，但没有把它转成排障和验收动作。执行上仍可能把 Codex in-app browser、Vite dev server 或 standalone renderer 当成用户要用的 App，从而出现“代码可能改对了，但用户面前没有可用桌面 App”的问题。

### 修复计划

1. 架构总览新增 App 验收红线，明确 `127.0.0.1:5180` 不是 App。
2. 技术架构新增 App 可用性判断规则，明确必须检查/启动 `npm run dev` 和 `desktop-photo-pet` Electron 进程。
3. 当前轮处理必须实际启动完整桌面 App 链路，并用本机窗口验证，而不是只回复浏览器状态。

### 本轮处理结果

- 已发现当时状态是 API 和 `desktop-photo-pet` Electron 进程存在，但 `127.0.0.1:5180` 没有监听，导致应用窗口无法加载 renderer。
- 已清理半启动状态，并用 `npm run dev` 重启完整开发态链路：API、Vite renderer、`desktop-photo-pet` 同时启动。
- 已用 Computer Use 验证本机 Electron App：桌宠窗口显示 Mochi 照片级小狗，点击桌宠后打开 `AI Pet Digital Twin MVP` 应用窗口，应用窗口可进入对话页和“我的”页，点击“关闭应用窗口”后桌宠窗口恢复。
- 为避免依赖 Codex 前台终端会话，已改为启动打包后的 `release/mac-arm64/AI Pet Demo.app`。交付态 App 当前作为独立 macOS 进程运行，加载 `app.asar/dist/index.html` 并监听 `127.0.0.1:8788` bundled API；再次验证了桌宠 -> 应用窗口 -> “我的”页 -> 关闭恢复桌宠。
- 结论：本轮真实问题是完整 App 链路缺少 renderer 进程，不是应该让用户继续使用浏览器页；后续排障必须先恢复桌面 App 链路。
