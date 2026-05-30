---
title: OpenPets 开源项目调研
description: OpenPets 的本地实际体验、接口能力和作为 AI Pet MVP 桌宠底座的复用判断。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - open-source
  - desktop-runtime
  - expression-adapter
source:
  - https://github.com/alvinunreal/openpets
  - ../../../../../../reports/pet-sandbox-overnight/run-results.json
---

# OpenPets

## 基本信息

- 仓库：<https://github.com/alvinunreal/openpets>
- GitHub 元数据：979 stars，34 forks，MIT，默认分支 `main`，最近 pushed_at `2026-05-28T07:34:59Z`。
- 技术栈：Electron + TypeScript + React + local IPC + MCP/CLI。
- 本机体验状态：pass，可运行，AI 控制链路实测成功。

## 实际使用体验

本地已执行：

```bash
pnpm install
pnpm build
pnpm dev:desktop
node packages/cli/dist/index.js status
node packages/cli/dist/index.js say '宠物沙箱 overnight 验证：AI 可以通过 CLI/MCP 控制我。' --reaction success
```

结果：

- macOS 能启动桌面宠物窗口和设置窗口。
- `status` 返回 appRunning=true，版本 2.5.0，默认内置宠物可见。
- `say` 命令能让宠物显示气泡，说明 agent/CLI 到桌宠表达的链路已经跑通。
- 体验截图：[openpets-pet-crop.png](../../../../../../reports/pet-sandbox-overnight/screenshots/openpets-pet-crop.png)。
- 证据日志：[openpets-status-rerun.json](../../../../../../reports/pet-sandbox-overnight/logs/openpets-status-rerun.json)、[openpets-say-rerun.log](../../../../../../reports/pet-sandbox-overnight/logs/openpets-say-rerun.log)。

## 与 AI Pet 框架的关系

OpenPets 最适合做“桌宠表达外壳”，而不是业务系统。它已经解决：

- 宠物窗口显示。
- pet pack / catalog / installed spritesheet 机制。
- CLI/MCP/IPC 控制链路。
- agent lease，避免多个 agent 混用同一宠物。
- 插件 runtime 与沙箱化扩展。

AI Pet 需要补的部分：

- 真实宠物档案。
- 设备/mock 数据接入。
- 健康和照护状态机。
- 库存、商品推荐、安全边界。
- “真实宠物资料 -> pet pack”的生成或导入流程。

## 复用建议

MVP 直接把 OpenPets 作为第一候选 renderer/API 壳。Domain Service 通过 MCP/CLI 或本地 IPC 控制 `say/react/status`，把“今日任务”“健康异常”“库存不足”“用户互动反馈”映射为桌宠气泡和状态反应。

不要把真实宠物业务逻辑写进 OpenPets renderer。正确边界是：OpenPets 负责表达，AI Pet Domain Service 负责事实和决策。

