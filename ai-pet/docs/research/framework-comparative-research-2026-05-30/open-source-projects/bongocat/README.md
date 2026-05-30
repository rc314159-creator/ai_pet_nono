---
title: BongoCat 开源项目调研
description: BongoCat 的本地实际体验、Tauri/Live2D 表达层和 AI Pet 形象路线判断。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
doc_type: research-evidence
domain_taxa:
  - open-source
  - desktop-runtime
  - live2d
source:
  - https://github.com/ayangweb/BongoCat
  - ../../../../../../reports/pet-sandbox-overnight/run-results.json
---

# BongoCat

## 基本信息

- 仓库：<https://github.com/ayangweb/BongoCat>
- GitHub 元数据：21100 stars，986 forks，MIT，默认分支 `master`，最近 pushed_at `2026-04-28T07:33:13Z`。
- 技术栈：Tauri + 跨平台互动桌宠。
- 本机体验状态：partial，构建启动成功，透明宠物窗口截图不稳定。

## 实际使用体验

本地已执行：

```bash
pnpm install
pnpm tauri dev
```

结果：

- 安装、构建和 Tauri dev 可以跑通。
- 本机截图没有稳定捕获到透明置顶宠物窗口。
- 普通浏览器预览因 Tauri asset/API 依赖显示空白。
- 体验截图：[bongocat-running.png](../../../../../../reports/pet-sandbox-overnight/screenshots/bongocat-running.png)。

## 与 AI Pet 框架的关系

BongoCat 的价值是跨平台桌宠形态、模型/素材导入和互动视觉，不是照护业务。它适合作为第二阶段形象层参考，尤其是未来要支持更自然的猫狗动作时。

## 复用建议

MVP 不建议把 BongoCat 作为主底座，因为 AI 控制链路和业务域不如 OpenPets 直接。可借鉴：

- 桌面透明窗口。
- 模型和动作资源管理。
- 键鼠/桌面互动反馈。

如果后续切到 Tauri renderer，需要先保证 MCP/IPC 控制链路和宠物状态映射。

