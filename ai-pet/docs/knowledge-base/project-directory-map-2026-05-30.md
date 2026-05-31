---
title: AI Pet 项目目录地图
description: 记录当前仓库目录职责、文件归属边界和源码打包规则，避免把报告、旧原型或临时产物误当成 App。
status: 已批准
created: 2026-05-30
updated: 2026-05-31
update_reason: 按单一 App 结构整理目录；删除过时宽屏 MVP 组件，不再保留 legacy 代码目录。
doc_type: kb-structure
related:
  - ../INDEX.md
  - ../architecture/current-system-architecture-2026-05-30.md
  - ../product/product-spec-2026-05-30.md
  - ../plan/mac-demo-distribution-2026-05-31.md
---

# AI Pet 项目目录地图

## 核心结论

当前仓库只有一个可运行 App：`ai-pet/`。

不存在需要继续维护的旧宽屏 MVP、HTML 展示页或旧应用。未被当前桌宠 + 应用窗口产品使用的旧组件应删除；历史截图、调研 HTML、验证 GIF 只能放在 `reports/` 作为证据，不能作为 App 入口。

## 根目录职责

| 路径 | 职责 | 管理规则 |
|---|---|---|
| `README.md` | 给外部接手者看的项目入口和打包说明 | 保持简洁，明确只有 `ai-pet/` 一个 App |
| `AGENTS.md` | 项目级 Codex 工作规则 | 只记录规则，不放产品事实或实现日志 |
| `docs/` | 根级会议记录、跨会话索引和参考资料 | 保持轻量索引；AI Pet 产品真相源在 `ai-pet/docs/` |
| `ai-pet/` | AI Pet 单一 App 源码、桌宠入口、应用窗口、服务端、资产、项目知识库 | 当前主项目目录 |
| `reports/` | 验证截图、GIF、HTML 调研报告和运行证据 | 不参与 App 运行，不作为产品入口 |
| `exports/` | 生成的源码包、图片包或其它交付压缩包 | 生成目录，不作为源码维护 |
| `.playwright-mcp/` | Playwright 临时日志 | 本地临时目录，已通过 `.gitignore` 忽略 |

根目录不直接放截图、临时 PNG、运行日志或源码副本。截图统一进 `reports/`，源码交付包统一进 `exports/source/`。

## `ai-pet/` 目录职责

| 路径 | 职责 | 当前状态 |
|---|---|---|
| `README.md` | App 内部运行、构建和打包说明 | 外部接手者进入 `ai-pet/` 后先读 |
| `desktop/photo-pet/` | 当前完整 Demo 的 Electron 桌宠集成入口 | `npm run dev` 会启动该入口；同一进程创建透明桌宠窗口和点击后的应用窗口，负责拖拽、点击、隐藏和恢复 |
| `desktop/app-window/` | standalone Electron 应用窗口 shell | 仅用于应用窗口 UI 调试；不创建桌宠，不能作为完整 App 验收 |
| `src/app/` | 当前应用窗口 React renderer | `App.tsx` 和 `styles.css` 只在这里保留一份 |
| `src/components/` | 当前 App 正在使用的共享组件 | 只保留 `ChatWaitingCue`、`KnowledgeBaseView`、`MochiMotionAvatar` 等现行组件 |
| `src/domain/` | 宠物档案、mock 数据、状态机、任务、动作和推荐规则 | 应用窗口、API 和 agent tools 的共享业务来源 |
| `server/` | Express API、Agent 接口、MCP tools、桌宠动作和外观桥接、本地 JSON stores | 服务应用窗口、桌宠运行时和 agent runtime |
| `public/assets/` | App 运行时图片、商品/社区图、Mochi 动作帧和配饰帧 | 会被 Vite build 打进 `dist/` |
| `scripts/assets/` | 配饰生图、归一化、装扮卡片等资产生成工具 | 不在运行时调用 |
| `scripts/motion_pack/` | 桌宠动作包处理工具 | 不在运行时调用 |
| `scripts/release/` | 构建清理、demo env、源码打包脚本 | `npm run package:source` 从这里生成源码 zip |
| `docs/` | AI Pet 项目知识库 | 产品、架构、模块、计划、修复记录的真相源 |
| `build/`、`dist/`、`release/` | 构建和安装包产物 | 生成目录，不作为源码维护 |
| `.ai-pet-data/` | 本地运行时 JSON 数据 | 本机临时状态，不打进源码包 |

## 当前运行入口

| 命令 | 启动内容 | 用途 |
|---|---|---|
| `npm run dev` | API + Vite renderer + `desktop/photo-pet` | 当前完整产品链路：系统级桌宠、点击后应用窗口、显隐联动 |
| `npm run dev:photo-pet` | `desktop/photo-pet/main.cjs` | 桌宠集成入口单独调试，通常需要 renderer/API 已运行 |
| `npm run dev:desktop` | `npm run dev:photo-pet` | 当前小狗桌宠入口别名 |
| `npm run dev:app` | `desktop/app-window/main.cjs` | standalone 应用窗口调试，不验证桌宠联动 |
| `npm run dev:renderer` | Vite `127.0.0.1:5180` | renderer smoke test；不能作为最终 App 验收 |
| `npm run build` | typecheck + renderer build + bundled API build | 交付构建前置步骤 |
| `npm run dist:mac` | 构建 unsigned Mac zip，不打包本地 `.env.local` | 普通交付构建 |
| `npm run dist:mac:demo` | 构建 unsigned Mac zip，并把当前 `.env.local` 放入 App 资源目录 | 可信试用 Demo 构建 |
| `npm run package:source` | 生成源码交付 zip | 给其他开发者接手源码使用 |

验证规则：涉及桌宠、应用窗口、点击、隐藏/恢复、外观同步或动作同步时，最终验证对象必须是 Electron 窗口，完整链路优先用 `npm run dev`。浏览器 localhost 只允许作为 renderer 开发期辅助。

## 源码打包规则

给别人使用源码时，从 `ai-pet/` 执行：

```bash
npm run package:source
```

生成文件在 `exports/source/`。源码包包含 App 源码、项目知识库、运行时 public assets、脚本和配置；排除以下内容：

- `.git/`
- `node_modules/`
- `build/`
- `dist/`
- `release/`
- `.ai-pet-data/`
- `release-config/.env`
- `.env`、`.env.local`
- `reports/`
- `exports/`
- 本机日志和临时目录

接收方解压后进入 `ai-pet/`，执行 `npm install` 和 `npm run dev`。

## 报告目录规则

| 路径 | 内容 |
|---|---|
| `reports/application-window-ui-2026-05-30/` | 手机比例应用窗口的对话、状态、换装、任务截图 |
| `reports/application-window-ui-2026-05-30/mochi-flow/` | 根目录散落的 Mochi 应用窗口流程截图归档 |
| `reports/application-window-ui-2026-05-30/user-incentive-v2/` | 根目录散落的用户激励 E2E 截图归档 |
| `reports/product-handoff-assets-2026-05-31/` | README 和产品侧发送使用的精选交付截图、录屏和质检联系表 |
| `reports/legacy-root-screenshots/` | 历史根目录临时截图，仅作证据，不代表仍有 legacy App |
| `reports/desktop-photo-pet-*` | 桌宠形象线生成的截图、GIF、动作验证产物 |
| `reports/*-research*/` | 调研 HTML 报告和截图 |

报告可以被知识库引用，但报告本身不是当前产品规格。产品结论必须写回 `ai-pet/docs/product/`、`ai-pet/docs/architecture/` 或 `ai-pet/docs/modules/`。

## 清理原则

- 不保留旧宽屏 MVP 组件、重复 `App.tsx`、重复 `styles.css` 或旧源码目录。
- `src/app/` 是应用窗口唯一主入口。
- `src/components/` 只存当前 App 实际引用的组件。
- `desktop/photo-pet/` 是完整桌面入口；`desktop/app-window/` 只能作为调试 shell。
- OpenPets 相关运行入口、桥接代码和旧脚本不再保留。
- 构建产物和运行时数据不打进源码包，交付 App 使用 `dist:mac` 或 `dist:mac:demo`。
