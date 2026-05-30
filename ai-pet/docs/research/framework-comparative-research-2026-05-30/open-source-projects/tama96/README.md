---
title: tama96 开源项目调研
description: tama96 的本地实际体验、Tamagotchi 状态机和 AI/MCP 边界对 AI Pet 的启发。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - open-source
  - virtual-pet-gameplay
  - mcp-tools
source:
  - https://github.com/siegerts/tama96
  - https://www.tama96.com/
  - ../../../../../../reports/pet-sandbox-overnight/run-results.json
---

# tama96

## 基本信息

- 仓库：<https://github.com/siegerts/tama96>
- 官网：<https://www.tama96.com/>
- GitHub 元数据：19 stars，2 forks，license 未声明，默认分支 `main`，最近 pushed_at `2026-04-04T13:51:56Z`。
- 技术栈：Rust + core tests + TUI + desktop/agent 概念。
- 本机体验状态：pass，核心测试和 TUI 可运行。

## 实际使用体验

本地已执行：

```bash
cargo test -p tama-core
cargo run -p tama-tui
```

结果：

- `tama-core` 的单元、集成、MCP、property tests 均跑过。
- TUI 可喂食、吃饭，并更新 hunger/weight。
- 它是 Tamagotchi P1 复刻，视觉不是自由桌面宠物沙箱，但照护规则严谨。

## 与 AI Pet 框架的关系

tama96 对 AI Pet 的价值在于“状态机严谨性”和“AI 权限边界”：

- 经典虚拟宠物有明确死亡/成长/饥饿/体重规则。
- MCP 让 agent 可以执行有限工具，而不是任意修改状态。
- TUI 说明核心逻辑可以与 UI 解耦。

## 复用建议

把它作为 `PetState` 和 `CareTool` 的设计参考：

- 真实宠物关联中，AI 不能直接把宠物改成“健康”，只能记录事件、生成任务、提示风险。
- 纯电子宠物中，喂食/清洁/玩耍必须经过冷却、代价和状态约束。
- MCP tool 应该是有限动作集合，而不是裸数据库写入。

