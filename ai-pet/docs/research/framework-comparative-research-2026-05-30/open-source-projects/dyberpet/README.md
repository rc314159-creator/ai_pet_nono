---
title: DyberPet 开源项目调研
description: DyberPet 的本地实际体验、背包道具体系和 AI Pet 玩法复用判断。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - open-source
  - inventory
  - virtual-pet-gameplay
source:
  - https://github.com/ChaozhongLiu/DyberPet
  - ../../../../../../reports/pet-sandbox-overnight/run-results.json
---

# DyberPet

## 基本信息

- 仓库：<https://github.com/ChaozhongLiu/DyberPet>
- GitHub 元数据：776 stars，78 forks，GPL-3.0，默认分支 `main`，最近 pushed_at `2026-05-20T14:49:45Z`。
- 技术栈：Python + PySide6 + Fluent Widgets。
- 本机体验状态：pass，可运行，资源/背包/自动投喂体系值得借鉴。

## 实际使用体验

本地已执行：

```bash
python3 -m venv .venv
.venv/bin/pip install pyside6==6.5.2 PySide6-Fluent-Widgets==1.5.4 pynput==1.7.6 tendo apscheduler
.venv/bin/python run_DyberPet.py
```

结果：

- 按 README 锁定依赖后可启动。
- 运行时出现 macOS 字体 alias warning，但不影响窗口显示。
- 代码和资源目录里有 role/pet/item/backpack/favorability/auto feed/minipet/dialogue 等结构。
- README 说明 LLM 模块未开源，所以 AI 聊天不作为可复用能力。
- 体验截图：[dyberpet-crop.png](../../../../../../reports/pet-sandbox-overnight/screenshots/dyberpet-crop.png)。

## 与 AI Pet 框架的关系

DyberPet 的价值不在 AI，而在“宠物生活系统”：

- item / backpack 可以映射到粮、零食、清洁用品、玩具、药品。
- favorability 可映射到亲密度和长期陪伴。
- auto feed 可映射到真实宠物照护记录和提醒。
- dialogue 可作为状态气泡和宠物反馈模板。
- mini-pet 可作为多宠或小组件的玩法参考。

## 复用建议

不建议直接采用 PySide UI 和 GPL 代码作为主工程依赖；可以抽象其玩法结构：

- `InventoryItem`：商品/道具类型、数量、适用宠物、约束。
- `CareAction`：喂食、清洁、玩耍、用药、梳毛。
- `CareEffect`：对饱腹、清洁、心情、健康 flag 的影响。
- `AutoCareRule`：库存足够且用户确认后提醒或执行记录。

对 AI Pet 最有用的是“电商商品不只是商品，而是可以进入宠物状态机的道具”。

