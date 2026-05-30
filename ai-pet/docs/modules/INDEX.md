---
title: AI Pet 模块分类索引
description: 按产品能力和工程边界组织模块 spec；新功能开发前用于定位应读文档和实现边界。
status: 已批准
created: 2026-05-30
updated: 2026-05-30
update_reason: 根据 MVP 功能设计讨论更新模块边界，明确桌宠主入口和应用窗口形态。
doc_type: module-spec
domain_taxa:
  - capability
  - domain-service
  - ui-channel
related:
  - ../product/product-spec-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../architecture/desktop-pet-app-window-linkage-protocol-2026-05-30.md
  - agent-chat-2026-05-30.md
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
| Agent 工具模块 | P0 | 让成熟 agent 调用宠物业务能力 | `research/agent-foundations.md`, `architecture/technical-architecture-2026-05-30.md` |
| 对话页 Agent 群聊模块 | P0 | 单宠物唯一长期主群聊，科技狗 Demo 角色，OpenAI Agents SDK，文字/语音模式和工具调用 | [agent-chat-2026-05-30.md](agent-chat-2026-05-30.md) |
| 桌宠核心入口模块 | P0 | OpenPets 常驻入口、气泡、动作、异常提示、点击展开应用窗口 | `components/DesktopPetBridge.tsx`, `research/desktop-pet-foundations.md` |
| 应用窗口模块 | P0 | 点击桌宠后弹出的功能面板，承载陪伴对话、数据异常、换装互动、任务和后续推荐 | `src/App.tsx`, `src/components/*` |
| 证据流与健康解释模块 | P0 | 把设备/手动数据解释成状态、任务和报告 | `research/mock-device-data-spec.md`, `research/health-monitoring.md` |
| 照护与互动任务模块 | P0 | 生成并完成喂食、遛狗、护理、玩耍等任务 | `src/domain/engine.ts` |
| 商品推荐与换装模块 | P1 | 由库存/任务/状态触发商品、装扮或服务推荐 | `research/open-source-ecommerce/INDEX.md` |
| 多端入口模块 | P1 | H5/PWA、飞书/微信、小程序、App 的统一入口策略 | `product/product-spec-2026-05-30.md` |
| 记忆模块 | P1 | 保存用户偏好、宠物习惯、聊天和互动历史 | 待拆分 spec |
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

所有 AI 功能都应优先通过成熟 agent 接入。对话页宠物群聊主 Agent 使用 OpenAI Agents SDK；项目侧只暴露业务工具：

- 读档案。
- 读状态。
- 读证据流。
- 规划任务。
- 记录照护或互动。
- 触发桌宠反馈。
- 生成推荐。

对话页详细口径见 [AI Pet 对话页 Agent 群聊模块](agent-chat-2026-05-30.md)。

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
- 查看和完成任务。
- 发起陪伴对话和健康问答。
- 进行换装/互动，并把结果同步到桌宠。
- 查看后续推荐或商业入口。
- 管理桌宠连接。

应用窗口不是 HTML 展示页或营销页。它可以用 React/Vite 渲染，但产品口径是“桌宠点击后弹出的功能面板”。当前必须和桌宠同时跑通。

## P1/P2 模块边界

### 商品推荐与换装

开发侧负责调研和执行，不要求用户给出完整方案。

最小闭环：

- MVP 先支持电子宠物装扮，用内置模板选择服装、帽子、鞋子、配饰或简单装饰。
- 换装结果同步到对话主页和桌宠。
- 从库存、任务、健康/状态或装扮需求触发推荐作为后续商业化入口预留。
- 推荐输出原因和适配条件。
- 后续支持商品、护理用品、玩具、装扮或服务。

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
