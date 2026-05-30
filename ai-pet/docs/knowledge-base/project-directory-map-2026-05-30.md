---
title: AI Pet 项目目录地图
description: 记录当前仓库目录职责、文件归属边界和整理规则，避免应用窗口端、桌宠形象端、知识库和验证报告混用。
status: 已批准
created: 2026-05-30
updated: 2026-05-30
update_reason: 根据用户要求整理整体文件目录，并明确当前应用窗口端与桌宠形象端的职责边界。
doc_type: kb-structure
related:
  - ../INDEX.md
  - ../product/product-spec-2026-05-30.md
  - ../plan/implementation-log-2026-05-30.md
  - ../plan/parallel-development-workstreams-2026-05-30.md
---

# AI Pet 项目目录地图

## 根目录职责

| 路径 | 职责 | 管理规则 |
|---|---|---|
| `AGENTS.md` | 项目级 Codex 工作规则 | 只记录规则，不放产品事实或实现日志 |
| `docs/` | 根级会议记录、跨会话索引和外部修复记录 | 保持轻量索引；AI Pet 产品真相源在 `ai-pet/docs/` |
| `ai-pet/` | AI Pet 代码、应用窗口、桌宠运行时、项目知识库 | 当前主项目目录 |
| `reports/` | 生成的验证截图、HTML 调研报告、运行证据 | 只放产物和证据，不作为产品真相源 |
| `.playwright-mcp/` | Playwright 临时日志 | 本地临时目录，已通过 `.gitignore` 忽略 |

根目录不再直接放截图、临时 PNG 或运行日志。截图统一归档到 `reports/` 下的任务目录。

## `ai-pet/` 目录职责

| 路径 | 职责 | 当前状态 |
|---|---|---|
| `desktop-app/` | 点开桌宠后的 Electron 应用窗口 shell | 当前应用窗口端入口；窗口比例约 `430x932` |
| `src/` | 应用窗口渲染层和领域 mock 逻辑 | 当前由 `src/App.tsx` 和 `src/styles.css` 承担手机比例功能面板 |
| `src/domain/` | 宠物档案、mock 数据、状态机、任务和推荐规则 | 应用窗口和后续 agent tools 的共享业务来源 |
| `src/components/` | 早期宽屏 MVP 组件 | 当前手机比例应用窗口未引用，待后续清理或迁移 |
| `server/` | Express API 与 OpenPets 桥接 | 保留为后续 agent/API 接入基础 |
| `desktop-photo-pet/` | 桌面端宠物形象独立运行程序 | 当前由另一条开发线/进程处理；应用窗口端不主动修改 |
| `public/assets/pets/mochi/` | Mochi 桌宠素材和动作帧 | 桌宠形象线资产；应用窗口端只可读取引用，不投入形象制作 |
| `scripts/` | 本地运行脚本和动作包工具 | 按具体工具归档子目录 |
| `dist/` | Vite 构建产物 | 生成目录，不作为源码维护 |
| `docs/` | AI Pet 项目知识库 | 产品、架构、模块、计划、修复记录的真相源 |

## 应用窗口端边界

当前本线只负责用户点击桌宠后打开的应用窗口/功能面板：

- 对话页：类似微信的上下文聊天窗口。
- 状态页：今日状态、健康数据、异常报告和趋势。
- 换装页：展示入口和 mock 交互。
- 任务页：照护任务、报告和后续推荐入口。

不负责：

- 桌面端宠物照片级形象。
- 桌宠动作帧生成。
- `desktop-photo-pet/` 的运行表现调参。
- `public/assets/pets/mochi/motions/` 的动作包产出。

这些由桌宠形象独立进程/开发线处理，后续再通过点击入口和状态同步接入应用窗口。

## 报告目录规则

| 路径 | 内容 |
|---|---|
| `reports/application-window-ui-2026-05-30/` | 手机比例应用窗口的对话、状态、换装、任务截图 |
| `reports/legacy-root-screenshots/` | 从根目录归档的早期临时截图 |
| `reports/desktop-photo-pet-*` | 桌宠形象线生成的截图、GIF、动作验证产物 |
| `reports/*-research*/` | 调研 HTML 报告和截图 |

报告可以被知识库引用，但报告本身不是当前产品规格。产品结论必须写回 `ai-pet/docs/product/`、`ai-pet/docs/architecture/` 或 `ai-pet/docs/modules/`。

## 待清理项

- `src/components/` 中的早期宽屏组件已不被当前 `App.tsx` 引用；后续可迁移到 `src/legacy/` 或删除，删除前需确认没有恢复宽屏 MVP 的需求。
- `reports/desktop-photo-pet-walk-20/`、`reports/desktop-photo-pet-walk-v2/` 等桌宠形象验证产物应由桌宠形象线统一整理。
- 旧 plan 和 architecture 文档仍有 frontmatter 不一致问题，继续在 `_GAP.md` 跟踪。

## 并行对话交接规则

后续多个 Codex 对话并行开发时，统一从 `ai-pet/docs/plan/parallel-development-workstreams-2026-05-30.md` 领取工作流。每个对话只修改自己工作流内的优先文件；跨工作流文件必须先查看 `git status --short` 并确认不会覆盖其他开发线改动。当前最重要的隔离边界是：

- 应用窗口线负责 `desktop-app/`、`src/App.tsx`、`src/styles.css` 和应用窗口截图报告。
- 桌宠形象线负责 `desktop-photo-pet/`、宠物动作素材、动作包脚本和桌宠报告。
- 领域状态线负责 `src/domain/`，需要同时服务应用窗口、桌宠联动和后续 agent tools。
- 知识库线负责索引、目录地图、GAP、实施记录和报告归档规则。
