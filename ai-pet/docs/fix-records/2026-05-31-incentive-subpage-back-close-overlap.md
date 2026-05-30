---
title: 2026-05-31 用户激励子页返回按钮与应用关闭按钮重叠问题记录
description: 记录 Electron 应用窗口中全局关闭 X 与用户激励子页返回按钮共用左上角安全区，以及浏览器验证未覆盖真实 Electron App 加载路径的问题。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - app-window
  - navigation
  - gamification
  - ui-layout
related:
  - ../modules/user-incentive-2026-05-31.md
  - ../architecture/current-system-architecture-2026-05-30.md
  - 2026-05-31-incentive-loop-and-thread-id-ui-leak.md
---

# 2026-05-31 用户激励子页返回按钮与应用关闭按钮重叠问题记录

## 事实时间线

- 用户在 Electron 应用窗口的“用户激励”页截图中指出：左上角全局关闭 `X`、页面返回箭头和窗口关闭区域视觉上重叠。
- 该问题出现在用户激励、每日任务、排行榜、奖励页和宠物知识库等使用 `.my-subpage-header` 的子页面。
- 先前只用 Vite 浏览器页面加模拟关闭按钮验证，未验证真实 Electron App。用户随后再次截图指出实际 App 仍显示重叠状态。
- 复查真实运行进程时发现：独立应用窗口由 `desktop-app/main.cjs` 打开；桌宠点击后的应用窗口由 `desktop-photo-pet/main.cjs` 打开，两条入口都需要覆盖。
- 修改桌宠入口开发态加载策略后，若 5180 Vite server 不可用，点击桌宠会打开 `chrome-error://chromewebdata/` 空白窗口，说明需要同时保留 dist fallback。

## 证据

- 截图中 `关闭应用窗口` 的白色圆形 `X` 位于应用内容左上角；页面返回箭头也位于相同左上角区域，两个圆形按钮互相挤压。
- 真实 Electron App 窗口标题为 `AI Pet Digital Twin MVP`；用户截图中“用户激励”页左上角仍同时出现 `X` 和返回箭头。
- 代码位置：
  - `desktop-photo-pet/main.cjs` 和 `desktop-app/main.cjs` 注入 `#ai-pet-window-close-overlay`，固定在左上角。
  - `src/App.tsx` 与 `src/components/KnowledgeBaseView.tsx` 使用 `.my-back-button`。
  - `src/styles.css` 将 `.my-back-button` 绝对定位到 `.my-subpage-header` 左上角。
  - `desktop-photo-pet/main.cjs` 在开发态也会优先加载已存在的 `dist/index.html`，导致源码修复不一定进入用户正在看的 Electron App。
  - `desktop-app/main.cjs` 在 Vite server 不可用时没有加载 dist fallback。

## 根因

- 应用窗口全局关闭按钮和页面内返回按钮没有划分导航层级与安全区。
- 全局关闭 `X` 是窗口级操作，应独占左上角；页面返回是页面级操作，不应和窗口级关闭按钮竞争同一位置。
- 验证目标错误：浏览器中的 Vite 页面不是用户正在看的 Electron App；`desktop-photo-pet` 开发入口因存在 `dist/index.html` 而加载旧构建产物，使 `src/styles.css` 的变更未反映到实际窗口。
- 单纯改成 dev 优先也不完整：Vite server 不可用时应回落到已更新 dist，否则桌宠入口会打开空白 Electron 窗口。

## 修复计划

1. 保留全局关闭 `X` 在左上角，不移动窗口级关闭入口。
2. 将用户激励相关子页和知识库子页的页面返回按钮移动到标题区域右侧，并显示文字标签。
3. 调整子页标题区域左右 padding，避免返回按钮压住标题。
4. 修改 `desktop-photo-pet` 开发态加载策略：非 packaged 且未显式指定 `AI_PET_LOAD_DIST=1` 时优先加载 Vite dev server；若 dev server 不可用或加载失败，则回落到 dist。
5. 修改 `desktop-app` 加载策略：Vite dev server 不可用或加载失败时回落到 dist，避免空白窗口。
6. 重新运行 `npm run build`，把样式修复写入 `dist`。
7. 重启真实 Electron App，并用 Computer Use 验证用户激励页不再在左上角出现返回箭头。

## 修复结果

- 已保留窗口级 `关闭应用窗口` X 在左上角。
- 已将用户激励、每日任务、排行榜、奖励/可解锁服饰和宠物知识库等子页的页面返回按钮改为右上角文字胶囊，显示 `返回我的` 或 `返回用户激励`。
- 已调整 `.my-subpage-header .mobile-top-nav` 的左右 padding，避免右侧返回胶囊压住标题。
- 已修复 `desktop-photo-pet/main.cjs` 和 `desktop-app/main.cjs` 的加载策略：开发态优先加载 Vite；Vite 不可用或加载失败时回落到 dist；显式 `AI_PET_LOAD_DIST=1` 或 packaged 仍加载 dist。
- 已执行 `npm run build`，生成新的 `dist/assets/index-BPlnBc0J.css` 和 `dist/assets/index-BjnnUUJI.js`；dist CSS 中已包含 `.my-back-button { left: auto; right: 0; }` 与 `content: attr(aria-label)`。
- 真实 Electron App 验证：从桌宠窗口点击打开 `AI Pet Digital Twin MVP`，进入“我的 -> 用户激励 -> 每日任务”；截图状态确认左上角只保留 `关闭应用窗口` X，页面返回按钮位于右上角文字胶囊，且每日任务详情页展示具体任务、完成状态、积分和时间窗口。
