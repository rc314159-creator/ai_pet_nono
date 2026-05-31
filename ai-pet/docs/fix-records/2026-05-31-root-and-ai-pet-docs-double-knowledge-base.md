---
title: 2026-05-31 根级 docs 与 ai-pet/docs 双知识库冲突问题记录
description: 记录根级 docs/INDEX.md 和 ai-pet/docs/INDEX.md 同时承担 AI Pet 项目索引导致事实重复、边界不清和执行入口冲突的问题。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - kb-structure
  - project-rule
related:
  - ../INDEX.md
  - ../knowledge-base/taxonomy.md
  - ../knowledge-base/project-directory-map-2026-05-30.md
  - ../../../docs/INDEX.md
  - ../../../AGENTS.md
---

# 2026-05-31 根级 docs 与 ai-pet/docs 双知识库冲突问题记录

## 事实时间线

- 项目根目录存在 `docs/INDEX.md`，其标题为 `Session Knowledge Base Index`，同时列出 AI Pet 的产品、架构、模块、计划、修复记录和调研入口。
- AI Pet 子目录也存在 `ai-pet/docs/INDEX.md`，并声明“本目录记录 AI 宠物项目的产品定位、调研、架构、Demo 计划、验证证据和修复记录”。
- `AGENTS.md` 要求进入项目时先读 `docs/INDEX.md`，再读 `ai-pet/docs/INDEX.md` 和核心 spec。
- 用户在 2026-05-31 指出“知识库为什么有两个？一个大目录知识库，一个小目录知识库，这两个有点矛盾”，要求统一。

## 证据引用

- `docs/INDEX.md` 已经复制列出大量 `../ai-pet/docs/...` 入口，包括产品规格、系统架构、技术架构、模块索引和数十条修复记录。
- `ai-pet/docs/INDEX.md` 同时维护同一批 AI Pet 当前结论、必读顺序、分类导航和修复记录。
- `ai-pet/docs/knowledge-base/taxonomy.md` 写有“不制造双真相源：同一事实只有一个权威文档”，但实际根级索引和子项目索引都在维护项目事实入口。
- `ai-pet/docs/knowledge-base/project-directory-map-2026-05-30.md` 已声明根级 `docs/` 只应保存会议记录、跨会话索引和参考资料，AI Pet 产品真相源在 `ai-pet/docs/`。

## 根因

- 早期整理时把根级 `docs/INDEX.md` 当成跨会话总索引使用，又把 AI Pet 子项目知识库扩展成正式产品/架构/spec 真相源，后续没有把根级索引收口成轻量路由。
- 根级索引复制了子项目知识库的大量细节，导致两个入口都像“权威知识库”，不符合单一真相源原则。
- 项目规则只写了“先读根 docs，再读 ai-pet/docs”，但没有明确根级 docs 只能做路由和原始材料索引，不能承载 AI Pet 当前产品事实。

## 正确结构判断

- AI Pet 是当前仓库唯一 App，项目级产品、架构、模块、计划、修复记录和验证标准的权威知识库应统一放在 `ai-pet/docs/`。
- 根级 `docs/` 只保留三类内容：原始会议记录、参考素材、到 `ai-pet/docs/INDEX.md` 的轻量跳转。
- 根级 `docs/INDEX.md` 可以作为进入仓库后的路由页，但不能复制 AI Pet 的长列表、当前结论或修复记录清单。
- 若根级 `docs/` 与 `ai-pet/docs/` 对同一 AI Pet 事实存在冲突，以 `ai-pet/docs/` 中已批准 spec 为准，并修正根级入口。

## 修复计划

1. 将根级 `docs/INDEX.md` 改成轻量路由页，只说明权威边界、原始材料和核心入口。
2. 在 `ai-pet/docs/INDEX.md` 增加知识库层级边界：`ai-pet/docs/` 是唯一权威项目知识库，根级 `docs/` 不是并列知识库。
3. 更新 `AGENTS.md`，保留先读根级入口的流程，但明确根级入口只用于定位，项目事实以 `ai-pet/docs/` 为准。
4. 更新知识库分类体系、目录地图和缺口记录，防止后续再次把根级索引扩展成第二套项目知识库。
5. 校验所有新增链接和索引引用。

## 修复结果

- 根级 `docs/INDEX.md` 已改为轻量路由页，只保留权威边界、AI Pet 核心入口、会议记录、参考素材和非 AI Pet 历史记录。
- `ai-pet/docs/INDEX.md` 已明确：`ai-pet/docs/` 是 AI Pet 唯一权威知识库，根级 `docs/` 不是并列知识库。
- `AGENTS.md` 已明确根级 `docs/INDEX.md` 只用于确认边界和原始材料位置，AI Pet 项目事实以 `ai-pet/docs/` 为准。
- 知识库分类体系、目录地图、产品逻辑框架和缺口记录已同步该边界，避免后续再次把根级索引扩展成第二套项目知识库。
- 验证：`git diff --check` 通过；已检查本次修改文档中的本地 Markdown 链接，链接目标均存在；残留的 `Session Knowledge Base Index` 只保留在本问题记录的历史证据中。
