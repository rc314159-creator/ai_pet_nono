---
title: 社区页 6 个真实图片卡片未在当前 app 屏幕内可见问题记录
status: fixed
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
domain_taxa:
  - app-window
  - community
  - visual-verification
related:
  - ../plan/implementation-log-2026-05-30.md
  - ../product/product-spec-2026-05-30.md
---

# 社区页 6 个真实图片卡片未在当前 app 屏幕内可见问题记录

## 事实时间线

- 用户要求市集和社区用真实商品/宠物图片替换占位，并把原 4 张扩展到 6 张，把页面填满。
- 先前实现把社区数据扩展到 6 个帖子，并下载了 6 张真实图片。
- 先前验证只确认 DOM 中有 6 个帖子、图片可加载，以及滚动后能看到第 5、6 个帖子。
- 用户在 in-app browser 的 `http://localhost:5180/` 截图显示社区页当前首屏仍只看到 4 个大卡片，下方留白，未达到“这一页填满”的视觉目标。

## 证据引用

- 用户截图：宠物社区页首屏只有 2x2 共 4 个卡片。
- 代码事实：`src/App.tsx` 已有 6 个 `communityPosts`，但 `src/styles.css` 中社区卡片仍使用接近原 4 卡布局的大图片和大卡片高度。

## 根因

修复验收口径错误：把“数据层有 6 个”和“可滚动看到 6 个”当成完成，但用户要的是当前 app 首屏视觉上补到 6 个。社区卡片尺寸仍按 4 卡布局设计，第三行被压到滚动区域下方，所以用户当前看到的页面没有补满。

## 修复计划

- 保留社区 6 个真实图片内容项。
- 将社区列表改为 2 列 x 3 行的紧凑卡片布局，使 6 个卡片在当前应用窗口首屏内可见。
- 保持图片、标题、摘要、作者和点赞数可读，但降低社区卡片图片比例、字号、间距和阴影。
- 用当前 `localhost:5180` 应用窗口复验首屏截图，确认肉眼可见 6 个卡片。

## 修复结果

- `src/styles.css` 为 `.community-screen` 增加首屏 6 卡紧凑布局：
  - 缩短社区页顶栏、搜索框和瀑布流间距。
  - 社区卡片图高固定为 `102px`。
  - 降低社区卡片标题、正文、作者和点赞区字号与间距。
- 当前 `http://localhost:5180/` 社区页首屏显示 2 列 x 3 行，共 6 个真实图片卡片。

## 验证

- `npm run typecheck` 通过。
- `npm run build` 通过。
- Playwright 使用 `860x1836` 视口打开 `http://localhost:5180/`，点击“社区”：
  - `postCount = 6`。
  - 6 个 `.post-card` 的 `getBoundingClientRect()` 均在当前 viewport 内。
  - `.community-screen` 的 `scrollHeight = clientHeight = 838`，首屏没有把第 5、6 个卡片藏到滚动区域下方。
- 验证截图：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/real-assets-v7/community-six-visible-current-app.png`。
