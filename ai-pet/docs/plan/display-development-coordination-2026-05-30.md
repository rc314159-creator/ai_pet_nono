---
title: AI Pet 展示阶段并行开发协调
description: 记录桌面宠物形象展示 session 与弹窗/应用窗口展示 session 的当前边界、共享文件和 Git 维护规则。
status: 已批准
created: 2026-05-30
updated: 2026-05-30
update_reason: 根据用户当前指令，明确当前只是展示开发阶段，尚未完成内部后台逻辑。
doc_type: coordination-plan
domain_taxa:
  - desktop-runtime
  - app-window
  - repository-hygiene
related:
  - ../product/product-spec-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - ../modules/INDEX.md
  - mvp-feature-design-2026-05-30.md
  - parallel-development-workstreams-2026-05-30.md
---

# AI Pet 展示阶段并行开发协调

## 当前事实

2026-05-30 当前有两个并行开发 session：

- 桌面端宠物形象展示 session：负责桌面宠物本体的视觉、动效、透明窗口、常驻位置和基础互动表现。
- 弹窗/应用窗口展示 session：负责点击桌宠后弹出的应用窗口/功能面板展示，包括陪伴主页、数据异常、任务和换装等界面。

当前只是展示开发阶段。内部后台逻辑、成熟 agent runtime、真实业务服务和持久化还没有完成。代码中出现的 mock 数据、前端状态、临时 API 或本地桥接都只能作为展示闭环支撑，不能在产品口径或知识库中描述为已完成后台。

## 文件边界

### 桌面端宠物形象展示 session

优先修改：

- `desktop-photo-pet/`
- `desktop-3d-pet/`
- `public/assets/pets/`
- 与桌宠运行、形象载入和本地展示直接相关的脚本。

谨慎修改：

- `server/openpets.ts`
- `scripts/run-openpets-dev.mjs`
- `src/components/DesktopPetBridge.tsx`

这些文件连接桌宠和应用窗口，修改前要确认不会破坏弹窗 session 的入口假设。

### 弹窗/应用窗口展示 session

优先修改：

- `desktop-app/`
- `src/App.tsx`
- `src/components/`
- `src/styles.css`
- 与应用窗口展示直接相关的 React/Vite 配置。

谨慎修改：

- `src/domain/types.ts`
- `src/domain/mockData.ts`
- `src/domain/engine.ts`

这些文件是两个展示 session 的共享状态来源。展示阶段可以扩展 mock 和纯函数，但不要把完整后台、agent loop、持久化或远程服务逻辑塞进应用窗口组件。

## 共享契约

- 桌宠和应用窗口共享宠物档案、状态、异常、任务和装扮结果的语义。
- 桌宠负责常驻、气泡、状态表达、点击入口和轻互动。
- 应用窗口负责复杂操作和信息密集展示。
- 当前 mock 数据必须继续支持真实宠物数字分身和纯电子宠物两类口径。
- 桌宠形象变化、装扮选择、异常提醒和任务完成结果都应保留可同步到另一端的字段或事件入口，即使后台尚未完成。
- 桌宠点击打开应用窗口属于基础跳转协议；桌宠动作来源优先级属于动作联动协议，两者分开实现和验证。
- 动作联动优先级固定为：agent 动作工具调用 > 指令触发的随机动作 > 手环/设备数据默认映射。对话页只和 agent 对话，不能绕过 agent 直接控制桌宠动作。

## Git 与文件管理规则

- 仓库边界是 `/Users/rencan/ai-pet-system`，根目录负责项目规则、跨会话知识库、报告证据和 `ai-pet/` 代码。
- 不提交 `node_modules/`、`dist/`、`.env*`、`*.tsbuildinfo`、`.playwright-mcp/` 和根目录临时截图。
- `reports/` 当前作为已有验证证据保留；新增大体积或临时报告前先判断是否应进入 `reports/` 或只作为本地临时产物。
- 两个 session 都应在修改前查看 `git status --short`，不要覆盖对方未提交的文件。
- 推荐按“桌宠展示”“弹窗展示”“共享契约/知识库”分别提交小粒度 commit。
- 推送远端前需要用户确认。

## 展示阶段验收

展示阶段先证明以下事实：

1. 启动后能看到系统级桌面宠物形象。
2. 桌宠点击后能打开应用窗口/功能面板。
3. 应用窗口能展示陪伴主页、数据异常、任务和换装中的关键状态。
4. mock 数据能驱动桌宠或应用窗口中的可见状态变化。
5. 当前实现没有把静态网页看板当成产品主入口。

每次跨边界改动后至少执行：

- `npm run typecheck`
- `npm run build`

涉及视觉和入口联动时，还需要用浏览器或 Electron 实际截图验证。

## 后续接入点

后续真实后台和 agent 接入时，不应重写展示层边界，而应补齐：

- 共享 Domain Service。
- OpenCode SDK / opencode runtime 工具调用。
- 桌宠事件到应用窗口的稳定 IPC 或本地协议。
- mock 数据到真实设备、手动记录和持久化数据的迁移路径。

## 并行工作流入口

后续多个对话并行开发时，以 [AI Pet 并行开发工作流](parallel-development-workstreams-2026-05-30.md) 为领取任务和判断文件边界的入口。该文档把当前展示阶段拆为应用窗口视觉、mock 数据/领域状态、桌宠点击联动、agent 工具接入、桌宠形象动作包、知识库仓库卫生和旧组件清理七条工作流。
