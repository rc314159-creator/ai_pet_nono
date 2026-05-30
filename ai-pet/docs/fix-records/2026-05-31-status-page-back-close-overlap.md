---
title: 2026-05-31 状态页返回按钮与应用关闭按钮重叠问题记录
description: 记录状态监测页左上角页面返回按钮与 Electron 应用窗口关闭 X 使用同一安全区，导致与用户激励页相同的重叠问题。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - app-window
  - navigation
  - status-monitoring
  - ui-layout
related:
  - 2026-05-31-incentive-subpage-back-close-overlap.md
  - 2026-05-31-status-page-reference-interaction-misalignment.md
---

# 2026-05-31 状态页返回按钮与应用关闭按钮重叠问题记录

## 事实时间线

- 用户在 Electron 应用窗口的“状态监测”页截图中指出：该页也存在和用户激励页一样的问题。
- 截图显示窗口级 `关闭应用窗口` X 位于左上角，状态页自己的返回箭头也位于左上角，两个圆形按钮视觉上重叠。
- 用户激励页已按“关闭 X 独占左上角、页面返回移到右上角文字胶囊”修复；状态页没有同步套用该导航安全区规则。

## 证据

- 截图中左上角可同时看到 `X` 和返回箭头；返回箭头贴近 X，形成相同安全区冲突。
- 代码位置：
  - `src/App.tsx` 中 `StatusScreen` 的 `.status-top-nav` 首个 `.status-nav-circle` 是 `aria-label="返回对话"` 的页面返回按钮。
  - `src/styles.css` 中 `.status-top-nav` 使用左右圆按钮布局，`.status-nav-circle` 未避让 Electron 注入的 `#ai-pet-window-close-overlay`。
  - `desktop-photo-pet/main.cjs` 与 `desktop-app/main.cjs` 注入的窗口级关闭 X 固定在左上角。

## 根因

- 状态页保留了旧的手机原型顶部导航：页面返回按钮位于左侧，和 Electron 应用窗口级关闭按钮共用左上角。
- 先前只修复了用户激励相关子页和知识库子页，没有把窗口级关闭按钮的全局安全区约束同步到状态页。

## 修复计划

1. 保留窗口级 `关闭应用窗口` X 在左上角。
2. 将状态页 `返回对话` 按钮移动到标题区域右上角，并显示文字标签。
3. 保留状态页设置按钮在右上角，但与返回按钮并排，不互相覆盖。
4. 调整状态页顶部标题区域 padding，避免标题、返回按钮、设置按钮互相压住。
5. 重新 build dist，重启真实 Electron App，并验证状态页左上角只剩窗口关闭 X。

## 修复结果

- 已保留窗口级 `关闭应用窗口` X 在左上角。
- 已将状态页 `返回对话` 从左上角圆形按钮改为右上角文字胶囊，和设置按钮并排。
- 已调整 `.status-top-nav` 的右侧按钮安全区和左侧关闭按钮安全区，避免标题、返回按钮、设置按钮互相压住。
- 已执行 `npm run build`，新的 dist CSS 已包含状态页顶部导航安全区修复。
- 真实 Electron App 验证：从桌宠打开 `AI Pet Digital Twin MVP`，进入“状态”页；截图状态确认左上角只剩 `关闭应用窗口` X，`返回对话` 位于右上角，设置按钮位于其右侧，不再重叠。
