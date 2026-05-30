---
title: 2026-05-30 桌宠过大、拖不动、点击不弹应用窗口问题记录
description: 记录桌宠窗口尺寸、拖动区域和点击打开应用窗口联动缺失的问题、根因、修复和验证。
status: 已修复
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
related:
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - ../plan/implementation-log-2026-05-30.md
  - ../plan/parallel-development-workstreams-2026-05-30.md
---

# 桌宠过大、拖不动、点击不弹应用窗口问题记录

## 事实时间线

- 2026-05-30，用户指出当前对话目标应聚焦“桌宠点击到应用窗口”和“应用窗口控制桌宠”联动，不应继续扩展 agent 层。
- 用户明确反馈三个桌宠运行问题：
  1. 桌宠显示过大，需要缩小。
  2. 桌宠不能拖动。
  3. 点击桌宠没有弹出应用窗口。
- 检查 `desktop-photo-pet/` 后确认：当前桌宠窗口 `520x520`，宠物本体 `460x460`；拖动只依赖透明背景上的 `.drag-zone`；点击 `#stage` 只执行 `setMotion(nextMotionId())`，没有打开应用窗口 IPC。

## 根因

- 尺寸问题：`desktop-photo-pet/main.cjs` 使用 `520x520` 窗口，`styles.css` 中 `.pet-wrap` 为 `460x460`，桌宠占屏幕空间过大。
- 拖动问题：`.drag-zone` 虽然设置了 `-webkit-app-region: drag`，但宠物可见主体 `.pet-wrap` 设置了 `-webkit-app-region: no-drag`，用户实际拖宠物本体时不会触发窗口拖动。
- 点击不弹窗：`runtime.js` 的点击事件只切换动作帧，没有向主进程发送打开应用窗口事件。

## 修复

- `desktop-photo-pet/main.cjs`
  - 桌宠窗口缩小为 `320x320`。
  - 新增应用窗口创建/聚焦逻辑，点击桌宠后打开或聚焦手机比例应用窗口。
  - 新增自定义拖动 IPC：`drag-start`、`drag-move`、`drag-end`。

- `desktop-photo-pet/preload.cjs`
  - 暴露 `openAppWindow`、`dragStart`、`dragMove`、`dragEnd` 给 renderer。

- `desktop-photo-pet/runtime.js`
  - 单击桌宠打开应用窗口。
  - 拖动桌宠时移动窗口，不再误触发点击。
  - 保留键盘数字切换动作用于调试。
  - 轮询 `/api/desktop-pet/motion`，为后续应用窗口控制桌宠动作预留消费入口。

- `desktop-photo-pet/styles.css`
  - 宠物本体缩小为 `282x282`。
  - 气泡、关闭按钮和底部动作标签按小窗口比例缩小。
  - 移除透明背景 CSS 拖动依赖，改用 renderer 自定义拖动。

## 验证

- `node --check desktop-photo-pet/main.cjs` 通过。
- `node --check desktop-photo-pet/preload.cjs` 通过。
- `node --check desktop-photo-pet/runtime.js` 通过。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- 已重启 `desktop-photo-pet/main.cjs`，桌面截图确认桌宠显示为缩小后的右下角小窗。

## 后续更新

- 真实桌宠动作播放只支持当前动作包 manifest 中已有的 `walk`、`jump`、`tail_wag`，其它动作命令会映射到这些可用动作。
- 2026-05-30 后续修复已把默认 `npm run dev` 改为 `api + renderer + desktop-photo-pet` 集成入口；`desktop-app/main.cjs` 仅保留为 standalone 应用窗口调试入口，避免默认开发时出现重复窗口和无法验证桌宠显隐的问题。
