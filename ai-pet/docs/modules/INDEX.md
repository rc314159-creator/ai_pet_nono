---
title: AI Pet 模块分类索引
description: 按产品能力和工程边界组织模块 spec；新功能开发前用于定位应读文档和实现边界。
status: 已批准
created: 2026-05-30
updated: 2026-05-31
update_reason: 将用户激励、每日任务、排行榜和奖励/服饰解锁拆成独立 P0 模块 spec。
doc_type: module-spec
domain_taxa:
  - capability
  - domain-service
  - ui-channel
related:
  - ../product/product-spec-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../architecture/product-logic-framework-2026-05-31.md
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - agent-chat-2026-05-30.md
  - pet-appearance-2026-05-31.md
  - user-incentive-2026-05-31.md
  - ../plan/mvp-feature-design-2026-05-30.md
---

# AI Pet 模块分类索引

## 分类原则

模块按可开发能力和稳定边界划分，不按窗口视图或文件夹划分。一个模块可以被应用窗口、桌宠、Agent、移动端和通讯软件同时使用。

开发对齐必须先按“现有依据 -> 功能大类 -> 具体功能 -> 待确认问题”拆解，不先按团队、展示或 PPT 叙事拆解。功能不能凭空设计，必须从已调研的现有产品、开源项目和可验证模式抽象出来。完整功能范围见 [AI Pet 功能范围与对齐问题](function-scope-2026-05-30.md)，调研到功能的映射见 [AI Pet 基于现有产品和开源项目的功能映射](research-grounded-function-map-2026-05-30.md)。

当前模块 spec 还未逐个拆出独立文件；本页和功能范围文档先作为模块真相入口。后续实现稳定后，再把每个模块拆成独立 `module-spec`。

## 模块总览

| 模块 | 当前优先级 | 作用 | 当前实现/证据入口 |
|---|---:|---|---|
| 宠物档案模块 | P0 | 管理真实宠物和纯电子宠物的基础设定 | `src/domain/mockData.ts`, `architecture/technical-architecture-2026-05-30.md` |
| 宠物状态机模块 | P0 | 支撑数字分身、电子宠物养成和桌宠反馈 | `src/domain/engine.ts`, `research/pet-game-ai-projects/INDEX.md` |
| Agent 工具模块 | P0 | 当前由 OpenCode/opencode 通过 `ai_pet` MCP tools 调用宠物业务能力；OpenAI Agents SDK 仅 fallback | `server/opencodeAgent.ts`, `server/mcp.ts`, `opencode.json`, `architecture/current-system-architecture-2026-05-30.md` |
| 对话页 Agent 群聊模块 | P0 | 单宠物唯一长期主群聊，可见名字/头像复用 PetProfile，OpenCode/opencode 主路径，文字/语音模式、长期记忆、主动开场和工具调用 | [agent-chat-2026-05-30.md](agent-chat-2026-05-30.md) |
| 应用内实时知识库模块 | P0 | 在“我的”页展示宠物身份、照护证据、长期记忆和实时事件，并通过本地 JSON store + SSE 实时更新 | [live-knowledge-base-2026-05-31.md](live-knowledge-base-2026-05-31.md), `server/knowledgeBase.ts` |
| 桌宠核心入口模块 | P0 | `desktop-photo-pet` 照片级 Electron 常驻入口、气泡、动作、异常提示、点击展开应用窗口 | `desktop-photo-pet/`, `public/assets/pets/mochi/motions/manifest.json`, `research/desktop-pet-foundations.md` |
| 应用窗口模块 | P0 | 点击桌宠后弹出的功能面板，承载陪伴对话、数据异常、换装互动、任务和后续推荐 | `src/App.tsx`, `src/components/*` |
| 宠物外观单一真相源模块 | P0 | 管理我的页、对话页、状态页和桌面桌宠共享的真实外观状态；当前只把配饰写入同步状态 | [pet-appearance-2026-05-31.md](pet-appearance-2026-05-31.md), `server/appearance.ts`, `src/components/MochiMotionAvatar.tsx` |
| 证据流与健康解释模块 | P0 | 把设备/手动数据解释成状态、任务和报告 | `research/mock-device-data-spec.md`, `research/health-monitoring.md` |
| 照护与互动任务模块 | P0 | 生成并完成喂食、遛狗、护理、玩耍等任务 | `src/domain/engine.ts` |
| 用户激励、任务积分与奖励模块 | P0 | 把每日照护任务完成转成积分、连续天数、排行榜和奖励/服饰解锁反馈 | [user-incentive-2026-05-31.md](user-incentive-2026-05-31.md), `src/domain/engine.ts`, `src/App.tsx`, `research/pet-community-ai-ecosystem/INDEX.md` |
| 商品推荐与换装模块 | P1 | 由库存/任务/状态触发商品、装扮或服务推荐 | `research/open-source-ecommerce/INDEX.md` |
| 多端入口模块 | P1 | H5/PWA、飞书/微信、小程序、App 的统一入口策略 | `product/product-spec-2026-05-30.md` |
| 记忆模块 | P0 | 保存主群聊消息、用户显式记忆、宠物事件记忆和记忆召回上下文 | [agent-chat-2026-05-30.md](agent-chat-2026-05-30.md), `server/threadStore.ts` |
| 社区/挑战模块 | P2 | 排行榜、挑战、分享和社区感 | `research/pet-community-ai-ecosystem/INDEX.md` |

## P0 模块边界

### 宠物档案

必须支持两类档案：

- 真实宠物：物种、品种、年龄、体重、过敏、病史、饮食、外观、照片引用。
- 纯电子宠物：物种/形象、人设、初始状态、成长偏好、装扮配置。

两类档案都进入统一 `PetProfile`，不能拆成两套不兼容系统。

### 宠物状态机

必须覆盖：

- 饱腹、心情、精力、清洁、亲密度。
- 健康/行为 flag。
- 成长、等级或阶段字段预留。
- 互动事件对状态的影响。
- 桌宠当前动作和表现状态。

状态机是产品核心，不应只服务真实宠物数据，也要服务纯电子宠物养成。

### Agent 工具

所有 AI 功能都应通过成熟 agent 接入。对话页宠物群聊主路径当前是 OpenCode/opencode runtime + `ai_pet` MCP tools；OpenAI Agents SDK 只作为 fallback。项目侧只暴露业务工具：

- 读档案。
- 读状态。
- 读证据流。
- 规划任务。
- 记录照护或互动。
- 触发桌宠反馈。
- 生成推荐。

对话页详细口径见 [AI Pet 对话页 Agent 群聊模块](agent-chat-2026-05-30.md)。

### 记忆模块

记忆模块当前是 P0，不是后续可选功能。对话页如果不能恢复历史，就不满足“单宠物唯一长期主群聊”。

当前最低要求：

- 每只宠物有稳定 `mainThreadId`。
- 消息流水必须按 `threadId` 持久化。
- 用户显式要求“记住”时必须写结构化 memory。
- 进入对话页时必须读取历史，而不是每次重新生成新对话。
- Agent 每轮输入必须包含最近群聊记录和长期 memory。
- 宠物主动提醒也必须写入同一个 thread。

Demo 阶段使用 `server/threadStore.ts` 的本地 JSON store；生产迁移数据库时，模块契约保持不变。

### 应用内实时知识库

应用内实时知识库是 P0 展示能力。它和长期主群聊记忆不同：记忆是 Agent 召回用的结构化事实，知识库板块是给用户和试用者看的运行时事实视图。

最低要求：

- “我的”页必须有宠物知识库入口。
- 知识库至少展示身份档案、照护证据、长期记忆和实时事件四类内容。
- 对话、主动提醒、配饰保存和任务完成必须写入知识库事件。
- 已打开知识库时，后端更新必须通过 SSE 或等价实时通道推到前端。
- Demo 阶段可用本地 JSON store，不得描述成正式云后台。

详细契约见 [AI Pet 应用内实时知识库模块](live-knowledge-base-2026-05-31.md)。

### 桌宠核心入口

桌宠必须具备：

- 常驻可见。
- 能主动说话。
- 能表达状态。
- 能响应用户点击并展开应用窗口。
- 能响应用户轻交互。
- 能把应用窗口/Agent/Domain 的结果反馈给用户。
- 能在异常发生时用气泡或提示把用户带到异常报告。
- 能接收手环/设备数据映射出的默认动作。
- 能接收指令触发的随机动作。
- 能接收 agent 通过动作工具发出的动作命令，并以最高优先级执行。

桌宠不是应用窗口的装饰组件。

大型交互不直接堆在桌宠本体上。长对话、数据查看、异常分析和换装应在应用窗口完成，并把结果同步回桌宠。

桌宠动作优先级以 [桌宠点击到应用窗口联动协议](../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md) 为准：agent 动作工具调用 > 指令触发的随机动作 > 手环/设备数据默认映射。

### 应用窗口

应用窗口负责：

- 默认进入陪伴对话主页。
- 查看和编辑宠物档案。
- 查看设备/手动数据。
- 查看异常报告和 AI 分析建议。
- 通过“我的”页中的用户激励入口进入任务、积分、排行榜和奖励解锁子流程。
- 在每日任务详情页查看和完成任务，并获得积分、连续天数、排行榜和奖励进度反馈。
- 发起陪伴对话和健康问答。
- 进行换装/互动，并把结果同步到桌宠。
- 查看后续推荐或商业入口。
- 管理桌宠连接。

应用窗口不是 HTML 展示页或营销页。它可以用 React/Vite 渲染，但产品口径是“桌宠点击后弹出的功能面板”。当前必须和桌宠同时跑通。

### 用户激励、任务积分与排行榜

每日照护任务不是孤立 checklist。当前 Demo 必须把任务完成转成用户激励：

- 每个任务有积分，优先级越高、护理风险越高，积分越高。
- “我的”页只放“用户激励”入口，不承载完整任务、排行榜和奖励清单。
- “我的”页仍保留宠物档案、宠物知识库和装扮功能；不能因为新增用户激励把装扮拆成同级入口集合。
- 点击“用户激励”进入独立激励页；再点击“每日任务”进入任务详情页，完成任务后今日积分、完成数和连续天数立即变化。
- 点击“排行榜”进入排行详情页；排名条目可点击查看明细，并高亮当前宠物，形成“照护行为 -> 正反馈 -> 排行展示”的闭环。
- 点击“奖励/可解锁服饰”进入奖励详情页；装扮页中标注“奖励获得”的服饰或配饰必须在这里有对应解锁来源、条件和进度。
- 排行榜当前可用 mock 数据，但当前宠物分数必须来自本地任务完成状态，不能只是静态图片或文字。

详细契约见 [AI Pet 用户激励、每日任务与奖励解锁模块](user-incentive-2026-05-31.md)。

## P1/P2 模块边界

### 社区/挑战模块

完整开放社区、真实 UGC、审核、真实比赛运营仍属于 P2；但任务积分和排行榜反馈已经拆为 P0 用户激励闭环，不能再因为“社区是 P2”而缺失。

### 商品推荐与换装

开发侧负责调研和执行，不要求用户给出完整方案。

最小闭环：

- MVP 支持装扮入口和道具系统，但当前展示阶段的真实桌宠换装只支持三个配饰项。
- 服装、毛发、妆容可以保留为应用窗口预览或后续方案，不写入桌宠外观状态，也不能在 Demo 口径中说成已完成真实换装。
- 三个配饰项需要真实同步到照片级桌宠：每张桌宠动作帧都要生成对应配饰的完整宠物图片，桌宠运行时按当前配饰状态切换整套完整帧。
- 配饰换装结果同步到对话主页、状态页、我的页和桌宠；这些位置都必须读同一个 `PetAppearanceState`，不能各自维护外观状态。
- 如果服饰或配饰标注为奖励获得，解锁来源归 [用户激励模块](user-incentive-2026-05-31.md) 管；装扮模块只展示已解锁/未解锁状态并提供预览或应用。
- 从库存、任务、健康/状态或装扮需求触发推荐作为后续商业化入口预留。
- 推荐输出原因和适配条件。
- 后续支持商品、护理用品、玩具、装扮或服务。

详细外观状态契约见 [宠物外观单一真相源模块](pet-appearance-2026-05-31.md)。

增强闭环：

- 电子宠物换装。
- 真实宠物照片试装。
- 同款推荐或定制推荐。

### 多端入口

当前优先桌宠 + 应用窗口。其他端口后续讨论，但架构必须预留统一入口：

- H5/PWA。
- 飞书/微信消息入口。
- 微信小程序。
- 手机 App。

禁止为每个端写一套业务逻辑。

## 后续拆分计划

优先拆出以下独立 module spec：

1. `agent-chat-2026-05-30.md`（已创建，后续可继续拆工具子 spec）
2. `agent-tools.md`
3. `desktop-pet-entry.md`
4. `app-window-entry.md`
5. `pet-profile-and-state.md`
6. `evidence-health-task.md`
7. `commerce-and-outfit.md`
8. `multi-channel-entrypoints.md`
