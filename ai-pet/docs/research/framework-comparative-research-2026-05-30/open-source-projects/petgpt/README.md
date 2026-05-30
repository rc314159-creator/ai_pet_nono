---
title: PetGPT 开源项目调研
description: PetGPT 的本地实际体验、Tauri 桌面模式和 AI/MCP 管理能力对 AI Pet 的启发。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - open-source
  - agent-runtime
  - mcp-tools
source:
  - https://github.com/JulesLiu390/PetGPT
  - ../../../../../../reports/pet-sandbox-overnight/run-results.json
---

# PetGPT

## 基本信息

- 仓库：<https://github.com/JulesLiu390/PetGPT>
- GitHub 元数据：99 stars，8 forks，license 未声明，默认分支 `main`，最近 pushed_at `2026-05-02T01:45:00Z`。
- 技术栈：Tauri + AI desktop pet + social agent + MCP manager。
- 本机体验状态：pass，Tauri 桌面模式可运行。

## 实际使用体验

本地已执行：

```bash
npm install
npm run tauri:dev
```

结果：

- 普通 Vite web 模式缺少 Tauri invoke，会报 `transformCallback/invoke undefined`。
- 必须用 `tauri:dev`。
- Tauri 模式可启动角色窗口、聊天窗口、MCP manager、social agent 相关界面。
- 体验截图：[petgpt-tauri-running.png](../../../../../../reports/pet-sandbox-overnight/screenshots/petgpt-tauri-running.png)。

## 与 AI Pet 框架的关系

PetGPT 的强项是 AI/MCP/社交 agent 管理，不是宠物照护或真实宠物数字分身。它适合做“宠物背后的智能助手管理台”参考：

- 多 agent / 多模型接入。
- MCP manager。
- 社交平台 agent。
- 本地记忆。

## 复用建议

第一版不应把 PetGPT 作为主路径，因为它会把注意力从宠物照护闭环带到 agent 平台。但它可以启发：

- AI Pet 管理工具页。
- MCP tool 权限配置。
- 通讯软件入口的未来接入方式。
- 多模型/多 provider 运行配置。

产品上要把 MCP 能力收口在宠物业务工具中，例如 `get_pet_state`、`record_care_event`、`plan_daily_tasks`，避免变成泛 agent 桌面壳。

