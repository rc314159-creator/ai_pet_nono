---
title: clawd-on-desk 开源项目调研
description: clawd-on-desk 的本地实际体验、HTTP 状态接口、主题系统和 AI Pet 可借鉴点。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - open-source
  - agent-status
  - desktop-runtime
source:
  - https://github.com/rullerzhou-afk/clawd-on-desk
  - ../../../../../../reports/pet-sandbox-overnight/run-results.json
---

# clawd-on-desk

## 基本信息

- 仓库：<https://github.com/rullerzhou-afk/clawd-on-desk>
- GitHub 元数据：3305 stars，333 forks，AGPL-3.0，默认分支 `main`，最近 pushed_at `2026-05-29T16:12:39Z`。
- 技术栈：Electron + HTTP hook server + theme system。
- 本机体验状态：pass，可运行，本地 HTTP 状态接口实测成功。

## 实际使用体验

本地已执行：

```bash
npm install
npm test
npm start
curl http://127.0.0.1:23333/state
curl -X POST http://127.0.0.1:23333/state -H 'Content-Type: application/json' -d '{"state":"happy"}'
```

结果：

- Electron app 可启动。
- `GET /state` 返回 ok=true。
- `POST /state` 可把宠物状态切到 happy。
- 启动会自动注册/同步 Gemini、Cursor、Codex、OpenClaw、Hermes 等 hooks，这对调研有价值，但产品里应改成显式授权。
- 体验截图：[clawd-happy-crop.png](../../../../../../reports/pet-sandbox-overnight/screenshots/clawd-happy-crop.png)。

## 与 AI Pet 框架的关系

它不是宠物养成系统，但有两个很强的可借鉴点：

1. **状态表达**：AI 正在工作、等待确认、成功、失败、警告，都可以映射为宠物状态。
2. **主题系统**：自定义主题、状态图、导入机制适合做宠物形象包。

## 复用建议

AI Pet 可以借鉴它的 HTTP 状态接口和主题验证，但不建议直接引入 AGPL 代码到主工程。产品上可映射：

- `planning_daily_tasks` -> 宠物思考状态。
- `care_alert` -> 警告/提醒状态。
- `recommendation_pending` -> 等待主人确认。
- `task_completed` -> happy / success。

关键边界：所有 agent hooks 必须显式授权，不能在用户不知情时写入其它工具配置。

