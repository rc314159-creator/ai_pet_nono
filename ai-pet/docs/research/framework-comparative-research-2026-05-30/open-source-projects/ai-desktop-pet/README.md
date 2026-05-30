---
title: AI-Desktop-Pet 开源项目调研
description: AI-Desktop-Pet 的本地实际体验、Live2D/AI 对话接口和 AI Pet 复用判断。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - open-source
  - live2d
  - ai-chat
source:
  - https://github.com/ruguo0119/AI-Desktop-Pet
  - ../../../../../../reports/pet-sandbox-overnight/run-results.json
---

# AI-Desktop-Pet

## 基本信息

- 仓库：<https://github.com/ruguo0119/AI-Desktop-Pet>
- GitHub 元数据：12 stars，3 forks，license 未声明，默认分支 `main`，最近 pushed_at `2026-01-22T04:18:01Z`。
- 技术栈：React + Pixi/Live2D + FastAPI WebSocket。
- 本机体验状态：partial，前端可运行，后端需环境变量，接口可测。

## 实际使用体验

本地已执行：

```bash
cd frontend && npm install
npm run dev -- --host 127.0.0.1 --port 5174
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
LLM_API_KEY=dummy PROFILE_LLM_KEY=dummy SILICON_API_KEY=dummy .venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

结果：

- 前端可打开，并加载 Hiyori Live2D 模型。
- 前端硬编码连接 `ws://127.0.0.1:8000/ws`，本机 8000 端口冲突，截图时 WebSocket 报错。
- 补 dummy env 并换到 8001 后，后端可启动，WebSocket upgrade 返回 101。
- README 协议和 `backend/main.py` 实现不完全一致，文档写 `ai_reply/ai_emotion`，代码实际发送 `state_update/audio_chunk`。
- 体验截图：[ai-desktop-pet-frontend.png](../../../../../../reports/pet-sandbox-overnight/screenshots/ai-desktop-pet-frontend.png)。

## 与 AI Pet 框架的关系

AI-Desktop-Pet 是 Live2D AI 伴侣样板，不是宠物照护系统。它的价值在：

- 前端 Live2D 模型加载。
- WebSocket 驱动表情/语音/状态更新。
- 长期记忆、视觉、TTS 这类 AI 伴侣能力。

它缺少：

- 真实宠物档案。
- 设备数据接入。
- 照护任务和健康解释。
- 库存和商品推荐。

## 复用建议

第一版不要把 Live2D 作为硬依赖；可以把它作为第二阶段“高级形象模式”。如果后续做猫狗 Live2D，需要先统一协议：

- `pet_state_update`
- `pet_say`
- `pet_emotion`
- `pet_action`
- `care_event_confirmed`

所有业务事实仍由 Domain Service 产生，Live2D 只负责表现。

