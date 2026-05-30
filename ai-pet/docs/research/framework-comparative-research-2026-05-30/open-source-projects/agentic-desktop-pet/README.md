---
title: Agentic-Desktop-Pet 开源项目调研
description: Agentic-Desktop-Pet 的本地实际体验、agent 后端和情绪/记忆模块对 AI Pet 的参考价值。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - open-source
  - agent-runtime
  - memory
source:
  - https://github.com/jihe520/Agentic-Desktop-Pet
  - ../../../../../../reports/pet-sandbox-overnight/run-results.json
---

# Agentic-Desktop-Pet

## 基本信息

- 仓库：<https://github.com/jihe520/Agentic-Desktop-Pet>
- GitHub 元数据：288 stars，40 forks，license 未声明，默认分支 `master`，最近 pushed_at `2026-01-10T13:43:07Z`。
- 技术栈：LLM + memory + emotion + RPG + Claude Code + Godot 前端。
- 本机体验状态：partial，后端可运行，Godot 前端未运行。

## 实际使用体验

本地已执行：

```bash
cd backend && uv run python --version
DEEPSEEK_API_KEY=dummy uv run python -m uvicorn main:app --host 127.0.0.1 --port 8002
curl http://127.0.0.1:8002/health
curl -X POST http://127.0.0.1:8002/chat -H 'Content-Type: application/json' -d '{"message":""}'
```

结果：

- `uv` 自动创建 Python 3.13.9 环境并安装依赖。
- FastAPI 后端可启动。
- `/health` 返回 Online。
- Godot 前端未运行。

## 与 AI Pet 框架的关系

它的方向接近“AI 宠物人格/记忆/情绪”，但与本项目 MVP 的真实宠物照护闭环不完全重合。可借鉴：

- agent backend。
- SSE/聊天接口。
- 记忆和情绪模块。
- RPG 化成长结构。

## 复用建议

作为二阶段参考。第一版 AI Pet 应优先做“真实证据 -> 任务/解释 -> 桌宠表达”，不要先做复杂人格系统。等 MVP 可信后，再把长期记忆和情绪人格加入共享能力层。

