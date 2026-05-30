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
  - ../architecture/current-system-architecture-2026-05-30.md
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
| `desktop-app/` | standalone Electron 应用窗口 shell | 仅用于应用窗口 UI 调试；不创建桌宠，不能验证桌宠点击、隐藏和恢复联动 |
| `src/` | Electron 应用窗口 renderer 和当前共享领域逻辑 | 当前由 `src/App.tsx` 和 `src/styles.css` 承担手机比例功能面板；它被 Electron 加载，不代表产品是 HTML 展示页 |
| `src/domain/` | 宠物档案、mock 数据、状态机、任务和推荐规则 | 应用窗口和后续 agent tools 的共享业务来源 |
| `src/components/` | 早期宽屏 MVP 组件 | 当前手机比例应用窗口未引用，待后续清理或迁移 |
| `server/` | Express API、Agent 接口、桌宠动作和外观桥接 | 当前服务应用窗口、`desktop-photo-pet` 和后续 agent tools；OpenPets 桥接只作为旧兼容能力保留 |
| `server/knowledgeBase.ts` | 应用内实时知识库本地 store 和 SSE 更新源 | 只服务运行时宠物事实板块，不替代项目 `docs/` 知识库 |
| `desktop-photo-pet/` | 当前完整 Demo 的 Electron 桌宠集成入口 | 默认 `npm run dev` 会启动该入口；同一进程创建透明桌宠窗口和点击后的应用窗口，负责桌宠拖拽、点击、隐藏和恢复 |
| `public/assets/pets/mochi/` | Mochi 桌宠素材和动作帧 | 桌宠形象线资产；应用窗口端只可读取引用，不投入形象制作 |
| `scripts/` | 本地运行脚本和动作包工具 | 按具体工具归档子目录 |
| `dist/` | Vite 构建产物 | 生成目录，不作为源码维护 |
| `docs/` | AI Pet 项目知识库 | 产品、架构、模块、计划、修复记录的真相源 |

## 应用窗口端边界

当前应用窗口 renderer 负责用户点击桌宠后打开的应用窗口/功能面板：

- 对话页：类似微信的上下文聊天窗口。
- 状态页：今日状态、健康数据、异常报告和趋势。
- 换装页：展示入口和 mock 交互。
- 任务页：照护任务、报告和后续推荐入口。

不负责：

- 桌面端宠物照片级形象。
- 桌宠动作帧生成。
- `public/assets/pets/mochi/motions/` 的动作包产出。

这些由桌宠形象开发线处理。应用窗口线只在以下情况修改 `desktop-photo-pet/`：点击桌宠打开应用窗口、应用窗口生命周期隐藏/恢复桌宠、应用窗口与桌宠之间的状态/外观/动作桥接。不得把 `desktop-photo-pet/renderer.html` 或 `src/App.tsx` 说成 HTML 展示页；它们都是 Electron 窗口的 renderer。

## 当前运行入口

| 命令 | 启动内容 | 用途 |
|---|---|---|
| `npm run dev` | API + Vite renderer + `desktop-photo-pet` | 当前完整产品链路：系统级桌宠、点击后应用窗口、显隐联动 |
| `npm run dev:photo-pet` | `desktop-photo-pet/main.cjs` | 桌宠集成入口单独调试，通常需要 renderer/API 已运行 |
| `npm run dev:desktop` | `desktop-photo-pet/main.cjs` | 当前小狗桌宠入口别名，不再启动 OpenPets built-in pet |
| `npm run dev:app` | `desktop-app/main.cjs` | standalone 应用窗口调试，不验证桌宠联动 |
| `npm run dev:openpets-app` | API + renderer + OpenPets + standalone 应用窗口 | 旧 OpenPets 调试入口，不是当前默认 Demo 入口 |
| `npm run dev:openpets-desktop` | OpenPets built-in pet | 旧像素宠物调试入口，只用于 OpenPets 兼容验证 |
| `npm run dev:renderer` | Vite `127.0.0.1:5180` | renderer smoke test；不能作为最终 App 验收 |
| `npm run dist:mac` | 构建 unsigned Mac zip，不打包本地 `.env.local` | 普通交付构建 |
| `npm run dist:mac:demo` | 构建 unsigned Mac zip，并把当前 `.env.local` 放入 App 资源目录 | 可信试用 Demo 构建，安装后可直接调用当前配置的模型网关 |

验证规则：涉及桌宠、应用窗口、点击、隐藏/恢复、外观同步或动作同步时，最终验证对象必须是 Electron 窗口，完整链路优先用 `npm run dev`。浏览器 localhost 只允许作为 renderer 开发期辅助。

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

- 应用窗口线负责 `src/App.tsx`、`src/styles.css`、`desktop-app/` 和应用窗口截图报告；涉及点击打开、关闭恢复、外观/动作状态桥接时，可以修改 `desktop-photo-pet/main.cjs` 与 preload 桥接文件。
- 桌宠形象线负责 `desktop-photo-pet/runtime.js`、宠物动作素材、动作包脚本和桌宠报告。
- 领域状态线负责 `src/domain/`，需要同时服务应用窗口、桌宠联动和后续 agent tools。
- 知识库线负责索引、目录地图、GAP、实施记录和报告归档规则。
