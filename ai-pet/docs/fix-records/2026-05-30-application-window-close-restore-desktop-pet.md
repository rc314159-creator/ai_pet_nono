---
title: 应用窗口缺少关闭入口导致桌宠无法恢复问题记录
description: 记录应用窗口打开后没有可见关闭按钮，用户无法关闭窗口触发桌宠恢复的问题、根因和修复计划。
status: 已修复
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
domain_taxa:
  - app-window
  - desktop-runtime
  - linkage
related:
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
---

# 应用窗口缺少关闭入口导致桌宠无法恢复问题记录

## 事实时间线

- 2026-05-30：用户反馈“页面打开之后没有关闭按钮”，并指出按产品逻辑关闭页面后桌面宠物应该回来。
- 当前 `desktop-photo-pet/main.cjs` 已有 `appWindow.on("closed", restorePetWindowAfterAppWindow)`，说明桌宠恢复动作依赖应用窗口真正关闭。
- 当前应用窗口 React 顶栏只有返回按钮和右侧图标按钮，按钮没有关闭窗口行为；`desktop-photo-pet` 创建应用窗口时也未给 renderer 暴露关闭 IPC。
- 2026-05-30 二次反馈：用户截图显示真实前台窗口仍然是左上角返回箭头，没有关闭键。
- Computer Use 实测真实窗口：`Electron` pid `45954`，窗口标题 `AI Pet Digital Twin MVP`，URL 为 `file:///Users/rencan/ai-pet-system/ai-pet/dist/index.html`，app path 为 `desktop-app`，不是 `desktop-photo-pet` 集成入口；辅助树中左上按钮 accessible name 仍为 `back`。
- 2026-05-30 再次排查发现，单纯依赖 React 顶栏渲染关闭按钮不够稳：真实运行窗口可能加载旧 `dist` 或 standalone 入口，导致源码层按钮改动没有出现在用户屏幕上。
- 2026-05-30 最终修复把关闭入口下沉到 Electron 主进程：应用窗口加载完成后由主进程注入 `关闭应用窗口` overlay，并通过 preload 暴露的 IPC 调用 `BrowserWindow.close()`。

## 证据引用

- `desktop-photo-pet/main.cjs`：`createAppWindow()` 中打开应用窗口时隐藏桌宠，并在 `closed` 事件中恢复桌宠。
- `src/App.tsx`：`MobileTopNav` 渲染圆形返回按钮，但没有绑定关闭窗口或导航行为。
- 2026-05-30 E2E 截图中应用窗口顶栏展示返回图标和通知图标，没有可见关闭按钮。
- Computer Use 截图和辅助树确认真实前台窗口仍加载旧 `dist/index.html`，且来自 `desktop-app/main.cjs` standalone 入口，不是 `desktop-photo-pet/main.cjs` 集成入口。

## 根因

第一轮根因是只有“应用窗口关闭后恢复桌宠”的后半段逻辑，没有“应用窗口内主动关闭自身”的入口和 IPC 契约。用户无法从手机比例应用窗口 UI 中触发 Electron `BrowserWindow.close()`，因此桌宠恢复逻辑无法被触发。

二次根因是验证目标错误：第一轮只验证了新启动的 `desktop-photo-pet` 测试实例，没有检查用户屏幕上真实存在的 `desktop-app` standalone 旧进程。该旧进程从 21:00 起一直加载旧构建产物，页面没有刷新到新 bundle；同时 `desktop-app` 自身也未接入关闭 IPC。即使集成入口已补逻辑，用户当前前台窗口仍然不会出现关闭键。

最终根因是关闭入口被放在普通 React 渲染层，不能抵抗旧构建产物、standalone 入口或缓存造成的真实窗口漂移。关闭窗口是桌宠显隐联动的系统级能力，必须由 Electron 主进程和 preload IPC 兜住，而不是只依赖某个页面 bundle 是否更新。

## 修复计划

1. 为 `desktop-photo-pet` 创建的应用窗口增加 preload，暴露 `window.aiPetAppWindow.close()` 和后续导航事件能力。
2. 关闭入口必须在真实 Electron 应用窗口内可见；最终以主进程注入 overlay + preload IPC 调用 Electron close。
3. 保持 `appWindow.on("closed")` 恢复桌宠逻辑作为单一恢复点，避免 renderer 直接操控桌宠显隐。
4. 通过类型检查、构建和 Electron/页面验证确认关闭入口可用，关闭后桌宠窗口恢复。
5. 同步修复 `desktop-app/main.cjs` standalone 调试入口，使它也提供同一套关闭 IPC，避免旧调试入口继续显示无效返回按钮。
6. 停止真实前台旧 Electron standalone 进程，重建并用 `desktop-photo-pet` 集成入口做真实 UI 复验。

## 修复结果

- 新增 `desktop-photo-pet/app-preload.cjs`，给应用窗口 renderer 暴露 `window.aiPetAppWindow.close()`。
- `desktop-photo-pet/main.cjs` 为应用窗口挂载 preload，并新增 `ai-pet-app-window:close` IPC，由主进程关闭当前 `BrowserWindow`。
- 新增 `desktop-app/preload.cjs`，并让 `desktop-app/main.cjs` standalone 调试入口也暴露同一套 `aiPetAppWindow.close()` IPC，避免旧调试入口继续显示无效返回键。
- 早期尝试曾把 React 顶栏左侧按钮改为 `X`，但真实窗口可能加载旧 bundle；最终有效关闭入口以后续主进程注入 overlay 为准。
- 应用窗口继续只通过 `closed` 事件恢复桌宠：关闭逻辑不直接在 renderer 中控制桌宠显隐。
- 已停止用户屏幕上的旧 `desktop-app/main.cjs` standalone Electron 进程，并启动正确的 `desktop-photo-pet/main.cjs` 集成入口。
- `desktop-photo-pet/main.cjs` 和 `desktop-app/main.cjs` 均新增主进程注入的 `#ai-pet-window-close-overlay`，页面加载完成后固定在左上角，accessible name 为 `关闭应用窗口`。
- 应用窗口加载 `dist/index.html` 时增加 cache-bust query，并使用临时 session partition，避免真实窗口继续复用旧 renderer 缓存。

## 验证结果

- `npm run typecheck` 通过。
- `node --check desktop-photo-pet/main.cjs`、`node --check desktop-photo-pet/app-preload.cjs`、`node --check desktop-photo-pet/preload.cjs` 通过。
- Playwright 页面截图 `/tmp/e2e-verify-ai-pet-chat-04-close-button.png` 显示左上角已有明确 `X` 关闭按钮，console error/warning 为 0，failed request 为 0。
- Playwright Electron smoke 验证：
  - 初始：仅 `AI Pet Photo Desktop Pet` 窗口可见。
  - 点击桌宠后：`AI Pet Digital Twin MVP` 应用窗口可见，桌宠窗口隐藏。
  - 点击应用窗口 `关闭应用窗口` 按钮后：应用窗口关闭，`AI Pet Photo Desktop Pet` 桌宠窗口恢复可见。
- Computer Use 真实窗口验证：
  - 修复前真实窗口 URL 为 `file:///Users/rencan/ai-pet-system/ai-pet/dist/index.html`，app path 为 `desktop-app`，左上按钮名为 `back`。
  - 二次修复后真实窗口由 `desktop-photo-pet` 点击打开，左上按钮名为 `关闭应用窗口`；点击该按钮后返回 `AI Pet Photo Desktop Pet` 桌宠窗口。
- Playwright Electron 二次 E2E 证据目录：`/tmp/e2e-verify/ai-pet-close-restore-real-window/`。
  - `01-desktop-pet-visible.png`：初始桌宠可见。
  - `02-app-window-close-button.png`：应用窗口左上角显示 `X` 关闭按钮，按钮 accessible name 为 `关闭应用窗口`。
  - `03-desktop-pet-restored.png`：点击关闭后桌宠恢复可见。
- 最终集成 E2E 证据目录：`/tmp/e2e-verify/ai-pet-integrated-close-agent-motion-llmmelon-final/`。
  - 点击桌宠后应用窗口内 `closeButtons[0].aria = "关闭应用窗口"` 且 `visible = true`。
  - 点击关闭后 `windowsAfterClose` 只剩 `AI Pet Photo Desktop Pet`。
  - 同轮 E2E 同时验证了对话动作链路，`failedRequests = []`、`consoleIssues = []`。
