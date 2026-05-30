---
title: AI Pet 知识库分类体系
description: 参考 kb skill 与 Codex skill 结构，为 AI 宠物项目建立知识库分类、入口、文档类型和更新规则。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
update_reason: 建立面向产品、调研、架构、执行和证据的知识库分类体系。
doc_type: kb-taxonomy
related:
  - ../product/positioning-framework-2026-05-30.md
  - ../INDEX.md
---

# AI Pet 知识库分类体系

## 分类目标

AI Pet 知识库不是资料堆放区，而是项目决策、实现和验证的工作记忆。分类体系需要同时回答四个问题：

1. 当前真相是什么：产品定位、MVP 范围、架构裁决、功能边界。
2. 证据在哪里：会议记录、调研、竞品、开源项目、测试报告。
3. 下一步怎么做：开发计划、分工、验证标准、待澄清问题。
4. 发生过什么问题：修复记录、根因、证据、后续预防。

## 分类原则

- 当前真相和历史证据分开：spec 写当前结论，会议记录和调研保留事实来源。
- 产品分类和技术分类分开：用户、场景、功能是产品 taxon；服务、数据、运行时是技术 taxon。
- 计划不能长期充当真相源：计划完成后，核心设计要合并到产品、架构或模块 spec。
- 不制造双真相源：同一事实只有一个权威文档，其他文档只引用或摘要。
- 先索引再细读：`INDEX.md` 是入口，具体文档根据任务按需读取。

## 目录分类

建议把 `ai-pet/docs/` 按下面的知识类型治理。现阶段不强制移动旧文件，先通过 `INDEX.md` 建立分类入口；后续整理时再按批准方案迁移。

```text
ai-pet/docs/
├── INDEX.md                     # 总入口：当前结论、分类导航、证据入口
├── knowledge-base/              # 知识库规则、分类体系、文档模板
├── product/                     # 产品定位、受众、场景、功能框架
├── architecture/                # 架构、数据流、服务边界、模块契约
├── modules/                     # 功能模块 spec，按可实现业务域拆分
├── research/                    # 竞品、开源项目、市场、技术调研
├── meetings/                    # 会议摘要和决策记录，原始转写可留在根 docs
├── plan/                        # 开发计划、范围锁定、执行日志
├── verification/                # E2E、截图、运行报告、评测证据
└── fix-records/                 # 问题记录、根因、修复计划和验证结果
```

## 文档类型

| 类型 | 用途 | 典型位置 | 是否当前真相源 |
|---|---|---|---|
| `product-spec` | 产品定位、受众、场景、功能边界 | `product/` | 是 |
| `architecture-spec` | 服务、数据、运行时、接口边界 | `architecture/` | 是 |
| `module-spec` | 单一功能模块的行为、状态、输入输出 | `modules/` | 是 |
| `research-evidence` | 竞品、开源项目、市场与技术证据 | `research/` | 否 |
| `meeting-synthesis` | 会议结论、决策链、开放问题 | `product/` 或 `meetings/` | 否，除非被 spec 接纳 |
| `plan` | 待执行步骤、验收标准、分工 | `plan/` | 否 |
| `verification` | 测试、截图、报告、日志证据 | `verification/` | 否 |
| `fix-record` | 问题时间线、根因、修复和验证 | `fix-records/` | 否 |
| `kb-taxonomy` | 知识库结构和治理规则 | `knowledge-base/` | 是 |

## 产品 Taxonomy

产品层按用户和价值链分类，而不是按代码目录分类。

### 一级分类

- `positioning`：产品定位、叙事、差异化。
- `audience`：目标用户、真实宠物用户、无宠物用户、汇报对象。
- `scenario`：日常陪伴、外出托管、健康异常、换装购物、桌面陪伴、通讯软件陪伴。
- `capability`：AI 聊天、数据绑定、健康解释、任务生成、换装、电商、社区挑战。
- `business`：付费点、商品推荐、联名/定制、转化路径。
- `safety`：医疗边界、隐私边界、购买确认、数据解释限制。

### 当前产品主线

| 主线 | 目标用户 | 核心价值 | 第一批文档 |
|---|---|---|---|
| 真实宠物关联 | 已养宠物的人 | 用 AI 解释真实宠物数据，辅助照护和陪伴 | `product/positioning-framework-2026-05-30.md`, `plan/mvp-scope.md` |
| 纯电子宠物 | 没有真实宠物但有陪伴需求的人 | 可聊天、可养成、可装扮的虚拟陪伴 | `product/positioning-framework-2026-05-30.md`, `research/pet-game-ai-projects/INDEX.md` |
| 共享能力层 | 两类用户共用 | 形象、记忆、状态、推荐、多端入口 | `architecture/mvp-architecture.md` |

## 技术 Taxonomy

技术层按边界和可替换性分类。

- `domain-service`：宠物档案、状态、任务、库存、推荐。
- `agent-runtime`：自然语言理解、工具调用、回复组织。
- `mcp-tools`：agent 与业务系统之间的工具契约。
- `desktop-runtime`：OpenPets 或其他桌宠底座。
- `health-adapter`：手动记录、mock 数据、CSV/JSON、未来硬件 API。
- `commerce-adapter`：商品目录、库存、推荐原因、未来电商 API。
- `ui-channel`：桌宠、桌宠弹出的应用窗口、通讯软件入口。
- `data-contract`：宠物档案、设备指标、任务、商品、事件日志。

## 证据 Taxonomy

证据层用于支撑产品和技术判断，但不直接作为当前真相。

- `meeting`：原始会议记录、结构化摘要、决策链。
- `market-product`：已有商业产品、竞品、用户体验模式。
- `open-source`：可复用项目、license、运行状态、适配成本。
- `technical-reference`：协议、框架、设备数据、第三方 API。
- `verification-result`：本地运行、截图、日志、测试、报告。
- `incident`：问题复现、根因、修复验证。

## 参考 Skill 的组织方式

Codex skill 的结构可以映射到项目知识库：

| Skill 结构 | 知识库映射 | 说明 |
|---|---|---|
| `description` | 文档 `description` 和 `doc_type` | 让 Agent 知道何时读取此文档 |
| 触发条件 | `INDEX.md` 的“何时读取”说明 | 避免每次加载全部文档 |
| 工作流 | spec 或 plan 的步骤 | 指导实现、验证和更新 |
| references | research、meeting、verification | 作为证据来源，不替代 spec |
| scripts/assets | 可运行 demo、测试、截图、报告 | 让结论可复验 |
| 禁止事项 | 架构裁决、安全边界 | 防止重复走错方向 |

## Frontmatter 模板

新文档建议使用下面的最小 frontmatter：

```yaml
---
title: <文档标题>
description: <一句话说明何时读它>
status: 起草中 | 已批准 | 已废弃
created: YYYY-MM-DD
updated: YYYY-MM-DD
update_reason: <最近一次修订原因>
doc_type: product-spec | architecture-spec | module-spec | research-evidence | meeting-synthesis | plan | verification | fix-record | kb-taxonomy
domain_taxa:
  - positioning
  - real-pet
related:
  - ../path/to/related.md
---
```

## 更新规则

1. 新讨论产生定位变化时，先写会议摘要或产品框架，再决定是否覆盖 MVP spec。
2. 新调研只放 `research/`，不能直接改“当前结论”，除非明确写出证据如何改变决策。
3. 新功能开发前读 `INDEX.md`、产品 spec、架构 spec、对应模块 spec。
4. 开发完成后把稳定行为同步到 `architecture/` 或 `modules/`，把执行过程留在 `plan/`。
5. 问题修复必须写 `fix-records/`，包含事实时间线、证据、根因、修复和验证。
6. 若 `INDEX.md` 的当前结论与具体文档冲突，以具体已批准 spec 为准，并在 `_GAP.md` 或待办中记录冲突。

## 当前整理状态

- 已建立产品框架入口：`product/positioning-framework-2026-05-30.md`。
- 已将用户确认的当前产品真相沉淀为 `product/product-spec-2026-05-30.md`。
- 已补齐当前技术架构真相源：`architecture/technical-architecture-2026-05-30.md`。
- 已新增模块级分类入口：`modules/INDEX.md`。
- 已将旧的扁平索引重组为分类入口。
- 暂未移动旧文档；移动、合并、重命名应另起整理计划并确认。
- 需要后续继续把 `modules/INDEX.md` 中的 P0/P1 模块拆成独立 module spec，并补齐 `verification/`。

## 新对话读取规则

AI Pet 项目的新对话必须先读：

1. `docs/INDEX.md`
2. `docs/product/product-spec-2026-05-30.md`
3. `docs/architecture/technical-architecture-2026-05-30.md`
4. `docs/modules/INDEX.md`

如旧的 `plan/` 或历史 `mvp-*` 文档与上述三份当前真相源冲突，以上述三份当前真相源为准。
