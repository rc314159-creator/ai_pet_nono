---
title: 2026-05-30 对话页消息名字应位于头像上方问题记录
description: 记录 Electron 应用窗口对话页中宠物消息名显示在气泡上方，而不是头像上方的问题。
status: 已修复
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
domain_taxa:
  - app-window
  - electron-runtime
  - chat-ui
related:
  - 2026-05-30-chat-profile-identity-sync.md
  - ../modules/agent-chat-2026-05-30.md
---

# 2026-05-30 对话页消息名字应位于头像上方问题记录

## 事实时间线

- 对话页已经把宠物名字和头像统一为 `PetProfile` 的“旺财”身份。
- 当前宠物消息布局仍是左侧头像、右侧 `message-stack`，作者名 `<em>` 位于气泡列顶部。
- 用户指出“这里的名字应该在头像的上方”，即宠物名应和头像组成同一身份列，而不是贴在气泡上方。

## 证据

- `src/App.tsx` 的消息列表中，宠物头像和 `message-stack` 是同级节点，`message.authorName` 在 `message-stack` 内渲染。
- `src/styles.css` 的 `.message` 使用横向 flex，`.message-stack > em` 只服务气泡列，因此名字会出现在气泡上方。

## 根因

- 头像和名字没有作为一个“消息身份区”组件处理。
- 早期双列聊天布局默认把作者名放进内容列，和当前“名字在头像上方”的视觉规则不一致。

## 修复计划

1. 将宠物消息的头像与名字包进独立身份列。
2. 宠物消息内容列只保留气泡和工具卡；用户消息仍保留名字在气泡上方。
3. 调整 CSS，使宠物名居中显示在头像上方，头像和气泡顶部对齐稳定。
4. 执行 TypeScript/build 验证，并用 Electron 应用窗口复查对话页。

## 修复结果

- 已调整 `src/App.tsx` 消息列表结构：宠物消息新增 `message-identity` 身份列，作者名和头像在同一列中渲染，内容列不再重复显示宠物名。
- 已调整 `src/styles.css`：宠物身份列居中排列，名字位于头像上方；宠物消息气泡通过内容列顶部补偿与头像顶部对齐；用户消息布局保持原样。
- 已执行 `npm run typecheck` 和 `npm run build`，均通过。
- 已启动 `AI_PET_LOAD_DIST=1 npm run dev:app`，在 Electron 应用窗口中通过 Computer Use 验证：
  - 对话页宠物消息节点顺序为 `文本 旺财` -> `旺财 头像` -> 消息气泡。
  - 视觉上“旺财”位于头像上方，而不是气泡上方。
