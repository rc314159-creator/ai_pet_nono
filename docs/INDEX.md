# Workspace Docs Index

本目录不是 AI Pet 的权威项目知识库。AI Pet 的产品规格、系统架构、模块边界、开发计划、修复记录和验证标准统一维护在 [`../ai-pet/docs/INDEX.md`](../ai-pet/docs/INDEX.md)。

根级 `docs/` 只保留仓库级路由、原始会议记录和参考素材。若本目录内容与 `ai-pet/docs/` 对同一 AI Pet 事实存在冲突，以 `ai-pet/docs/` 中已批准 spec 为准，并修正根级入口。

## AI Pet Canonical Entry

进入 AI Pet 项目工作时，按以下顺序读取：

1. 本页：只确认知识库边界和原始材料位置。
2. [`AI Pet Docs Index`](../ai-pet/docs/INDEX.md)：AI Pet 权威知识库入口。
3. [`AI Pet 产品逻辑与分层框架`](../ai-pet/docs/architecture/product-logic-framework-2026-05-31.md)。
4. [`AI Pet 当前系统架构总览`](../ai-pet/docs/architecture/current-system-architecture-2026-05-30.md)。
5. [`AI Pet 当前产品规格`](../ai-pet/docs/product/product-spec-2026-05-30.md)。
6. [`AI Pet 技术架构`](../ai-pet/docs/architecture/technical-architecture-2026-05-30.md)。
7. [`AI Pet 模块分类索引`](../ai-pet/docs/modules/INDEX.md)。

AI Pet 的修复记录、计划、调研和模块 spec 不在根级索引重复列全量清单；需要时从 `ai-pet/docs/INDEX.md` 进入。

## Root Materials

### Meeting Records

- [会议记录 2026-05-30 11:20](会议记录/会议记录-会议 2026_5_30 11_20_46.md)
- [MVP 功能设计与产品讨论 2026-05-30 14:36](会议记录/MVP功能设计与产品讨论.txt)

### Reference Materials

- [`docs/参考/`](参考/)：用户提供或历史整理的参考 HTML、需求说明和视频素材。参考材料只能作为证据或设计输入，不能替代 `ai-pet/docs/` 中的已批准 spec。

### Non-AI-Pet Historical Records

- [2026-05-27 PaperOrchestra report verification gap](fix-records/2026-05-27-paperorchestra-report-verification-gap.md)

## Governance

- 当前 AI Pet 只有一套权威知识库：`ai-pet/docs/`。
- 根级 `docs/INDEX.md` 只做路由，不承载 AI Pet 当前真相。
- 新增 AI Pet 产品、架构、模块、计划、修复记录或验证记录时，写入 `ai-pet/docs/` 并更新 `ai-pet/docs/INDEX.md`。
- 新增原始会议记录或参考素材时，可以放入根级 `docs/`，但必须在需要时把结论沉淀到 `ai-pet/docs/` 对应 spec。
