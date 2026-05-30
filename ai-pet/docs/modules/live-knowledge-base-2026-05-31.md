---
title: AI Pet 应用内实时知识库模块
description: 记录应用窗口内“宠物知识库”板块、实时同步机制、本地持久化和打包交付边界。
status: 已批准
created: 2026-05-31
updated: 2026-05-31
update_reason: 用户要求补全项目中的知识库板块并实现实时更新功能。
doc_type: module-spec
domain_taxa:
  - memory
  - domain-service
  - ui-channel
  - data-contract
related:
  - INDEX.md
  - ../architecture/current-system-architecture-2026-05-30.md
  - agent-chat-2026-05-30.md
---

# AI Pet 应用内实时知识库模块

## 定位

应用内“宠物知识库”是给试用者看的宠物事实板块，不是项目 `docs/` 知识库的替代物。

它负责把当前 Demo 中可被用户理解的事实集中展示出来：

- 宠物身份档案。
- 健康和照护证据。
- 主群聊长期记忆。
- 任务完成、配饰同步、主动提醒和对话事件。

项目 `docs/` 仍然是产品、架构和开发真相源；应用内知识库是运行时数据视图。

## 当前实现边界

当前 Demo 使用本地 JSON store 和 Server-Sent Events 实现实时同步：

- 本地知识库文件默认写入 `.ai-pet-data/knowledge-base.json`。
- 打包 App 中写入 macOS 用户数据目录下的 `data/knowledge-base.json`。
- API 提供 `GET /api/knowledge-base` 读取当前快照。
- API 提供 `GET /api/knowledge-base/stream` 推送实时更新。
- API 提供 `POST /api/knowledge-base/events` 接收 UI 侧任务完成等事件。
- 对话、memory、主动提醒、配饰保存和任务完成会写入知识库事件。

这不是生产后台数据库。它是可安装 Demo 的最小持久层，用来证明“使用过程中知识库会实时更新”这一产品能力。

## 板块结构

应用窗口的“我的”页新增“宠物知识库”入口。进入后展示四个分区：

| 分区 | 内容 | 主要来源 |
|---|---|---|
| 身份档案 | 名字、品种、年龄、体重、过敏和饮食限制 | `PetProfile` |
| 照护证据 | 今日状态、异常观察、库存和待办任务 | mock/device/domain 数据 |
| 长期记忆 | 用户明确要求记住的偏好、承诺和关系事实 | `threadStore` memory |
| 实时事件 | 对话、主动提醒、任务完成和配饰同步 | API 事件写入 |

## 实时更新规则

知识库更新必须来自业务事件，而不是用户打开页面时伪造刷新：

1. 用户发送消息后，`/api/agent/chat` 写入用户消息、宠物回复和 memory，再同步知识库。
2. 主动提醒生成后，`/api/agent/threads/:threadId/proactive` 写入提醒事件。
3. 用户保存桌宠配饰后，`/api/desktop-pet/appearance` 写入外观事件。
4. 用户完成每日任务后，应用窗口调用 `POST /api/knowledge-base/events` 写入任务事件。
5. 已打开的知识库页面通过 SSE 收到新快照并立即刷新。

如果 SSE 断开，前端仍通过普通读取接口恢复当前快照；断开状态不得阻止 App 使用。

## 禁止事项

- 不把应用内知识库称为已经完成的云端后台或正式数据库。
- 不把项目 `docs/` 的开发文档直接展示给试用者当产品知识库。
- 不在聊天 UI 中暴露内部 thread id、MCP、模型、fallback 等工程词。
- 不把用户未触发的事件伪装成实时更新。
