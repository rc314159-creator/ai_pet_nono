---
title: 2026-05-30 对话页名字头像未复用我的页宠物身份问题记录
description: 记录 Electron 应用窗口对话页仍使用独立科技狗名字和圆点头像，未与我的页旺财头像/名字引用同一份宠物资料的问题。
status: 已修复
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
domain_taxa:
  - app-window
  - electron-runtime
  - pet-profile
  - agent-chat
related:
  - ../modules/agent-chat-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - 2026-05-30-electron-window-verification-target.md
---

# 2026-05-30 对话页名字头像未复用我的页宠物身份问题记录

## 事实时间线

- Electron 应用窗口“我的装扮”页已经显示宠物名“旺财”和头像 `assets/pets/mochi/wangcai-profile-avatar-v1.png`。
- 对话页顶部仍显示“科技狗家庭群”，群成员和宠物消息作者仍显示“科技狗”。
- 对话页消息左侧头像仍是 CSS 渐变圆点，没有引用“我的装扮”页使用的宠物头像资源。
- 用户明确指出：“这里的名字和头像 我的那个页面的名字和头像保持一致，就是实际上就是引用同一个东西”，并进一步纠正验证对象是“这个 app 的页面，不是 html 的页面”。

## 证据

- `src/App.tsx` 的 `OutfitView` 中存在 `const profileDisplayName = "旺财"`，头像来自 `profile.avatar.profileImageUrl`。
- `src/App.tsx` 的 `ChatHome` 使用 `persona.groupName`、`persona.displayName` 渲染标题、群成员和消息作者。
- `src/styles.css` 的 `.message-avatar` 使用渐变背景，没有图片资源。
- `src/domain/agent.ts` 的 Demo persona 和初始消息仍有多处“科技狗”和“Mochi”硬编码。

## 根因

- 宠物资料中只有内部英文名 `profile.name = "Mochi"` 和头像 URL，没有统一的 UI 显示身份字段。
- “我的”页为了贴合展示临时硬编码了“旺财”，对话页继续读取 Agent persona 的演示角色名，导致同一个宠物在不同应用窗口页面里出现两套名字。
- 消息头像作为样式占位实现，未抽成复用组件，因此没有共享“我的”页头像来源。

## 修复计划

1. 在 `PetProfile` 中补充统一的可见显示名字段，并在 mock profile 中写入“旺财”。
2. 新增宠物显示身份 helper，统一返回显示名和头像 URL。
3. “我的装扮”页和对话页都通过同一个 helper/组件读取宠物名字和头像。
4. Agent persona 在 UI 和 fallback 文案中跟随宠物显示名，保留内部工具/线程机制。
5. 用 Electron 应用窗口打开对话页和“我的”页验证，不用浏览器页面作为最终验收。

## 修复结果

- 已在 `PetProfile` 增加 `displayName`，当前 Mochi 档案的可见显示名为“旺财”。
- 已新增 `src/domain/profile.ts`，统一返回宠物显示名和头像 URL。
- 已将“我的装扮”页和对话页消息头像改为复用同一个 `PetProfile` 显示身份。
- 已将对话页标题、群成员、消息作者、初始消息和本地 Agent fallback 文案改为跟随当前宠物显示名。
- 已顺手将社区页首条宠物动态的标题和作者改为从同一宠物显示名生成，避免切页后出现旧的“科技狗/Mochi”可见名字。
- 已同步更新产品规格和对话页 Agent 模块文档，明确可见名字/头像不能由页面各自硬编码。
- 已执行 `npm run typecheck` 和 `npm run build`，均通过。
- 已启动 `AI_PET_LOAD_DIST=1 npm run dev:app`，在 Electron 应用窗口中通过 Computer Use 验证：
  - 对话页显示 `旺财家庭群`、`旺财 · 主人 · 主群聊`，宠物消息作者为“旺财”，消息头像为 `旺财 头像` 图像。
  - “我的装扮”页显示同一个 `旺财 头像` 图像和标题“旺财”。
