---
title: AI Pet 入口页 Logo 图标素材修正记录
description: 记录欢迎/开始陪伴页 logo 使用错误图形，应替换为用户提供的正确爪印笑脸图标素材。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - ui-channel
  - brand
related:
  - ../product/product-spec-2026-05-30.md
  - ../fix-records/2026-05-31-desktop-pet-click-skips-welcome-page.md
---

# 入口页 Logo 图标素材修正记录

## 事实时间线

- 2026-05-31，入口页已按参考页对齐品牌文字和 slogan，但 logo 仍使用前端拼接的 `lucide-react` 爪印加爱心图形。
- 用户提供正确 logo 图片：`7c76c188cd2215a52ca2429477a21073.jpg`，要求“这个是对的 Logo 图标请修正一下”。
- 代码检查确认当前 `WelcomeView` 中 logo 由 `<PawPrint />` 和 `<Heart />` 组合渲染，并不等于用户提供的正确图标。

## 证据引用

- `src/App.tsx`：修复前 `WelcomeView` 的 `.brand-logo` 内部使用 `PawPrint` 与 `Heart` 图标。
- `src/styles.css`：修复前 `.brand-logo` 只绘制渐变圆角底和白色矢量图标。
- 用户提供的 JPG：1024x1024 爪印笑脸 logo，作为入口页正确品牌图标素材。

## 根因

入口页对齐参考 HTML 时，只根据参考页结构复刻了“爪印 + 爱心”的抽象形态，没有使用用户确认的正式 logo 图片，导致 logo 图标不准确。

## 修复计划

1. 将用户提供的 JPG 放入项目静态资产：`public/assets/brand/logo-paw-smile.jpg`。
2. 将 `WelcomeView` 的 logo 渲染改为 `<img src="assets/brand/logo-paw-smile.jpg" />`。
3. 移除入口页 logo 中的拼接爪印/爱心样式，保留外层圆角、光晕和阴影。
4. 执行构建和真实 Electron App 入口页验证。

## 验证结果

- 已执行：`npm run build`，TypeScript、Vite renderer build、dist asset prune 和 server bundle 均通过。
- 已执行：真实 Electron App 入口页验证，页面已显示用户提供的爪印笑脸 logo，仍保留三行 slogan、动态小狗、“开始陪伴”和“数字生命桌宠”。
