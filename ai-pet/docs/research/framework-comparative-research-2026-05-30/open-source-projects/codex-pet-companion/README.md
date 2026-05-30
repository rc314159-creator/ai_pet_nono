---
title: codex-pet-companion 开源项目调研
description: codex-pet-companion 的本地实际体验、宠物状态机价值和 AI Pet 复用判断。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - open-source
  - pet-state-machine
source:
  - https://github.com/pixel-raccoon/codex-pet-companion
  - ../../../../../../reports/pet-sandbox-overnight/run-results.json
---

# codex-pet-companion

## 基本信息

- 仓库：<https://github.com/pixel-raccoon/codex-pet-companion>
- GitHub 元数据：3 stars，0 forks，license 未声明，默认分支 `main`，最近 pushed_at `2026-05-06T08:26:46Z`。
- 技术栈：Python + PySide6 + spritesheet pet pack。
- 本机体验状态：pass，可运行，宠物照护逻辑最贴近 AI Pet 业务。

## 实际使用体验

本地已执行：

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m codex_pet_companion.main
```

结果：

- macOS 下可直接跑起 PySide6 桌宠。
- UI 中已有 Fullness、Mood、Energy、Focus、Friendship、days-together、Feed、Play、Rest、Today's activity。
- `core/virtual_pet.py` 里有冷却、每日计数、喂食/玩耍/休息收益、疲劳、过饱限制、成就和羁绊值。
- `core/daily_activities.py` 能按日期、宠物和状态生成每日活动文本。
- 体验截图：[codex-pet-companion-crop.png](../../../../../../reports/pet-sandbox-overnight/screenshots/codex-pet-companion-crop.png)。

## 与 AI Pet 框架的关系

它不适合作为主桌宠运行时，因为缺少通用 HTTP/MCP API，也不是面向多 agent 的可视化壳。但它非常适合回答 AI Pet 的一个核心问题：虚拟宠物应该如何从互动中改变状态。

可借鉴模块：

- 状态字段：饱腹、心情、精力、专注、亲密度。
- 行为冷却：避免无限刷喂食/玩耍。
- 每日活动：把宠物状态和日期变成可展示任务。
- pet pack：pet.json + spritesheet.webp 的素材格式。

## 复用建议

不要搬 UI。建议把状态机设计移植到 `PetState` 模块：

- 真实宠物关联主线中，mock 设备数据和照护事件驱动状态变化。
- 纯电子宠物主线中，用户聊天、喂食、玩耍、休息直接影响状态。
- 今日任务可以从 `DailyActivity` 扩展为“照护任务 + 娱乐任务 + 风险观察”。

