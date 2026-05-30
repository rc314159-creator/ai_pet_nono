---
title: AI Pet 框架化竞品与开源项目调研 2026-05-30
description: 基于 AI 情感陪伴型宠物产品框架，对现有商业产品和可复用开源项目做目录化专项调研。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
update_reason: 用户要求基于讨论框架重新充分调研开源项目、已有产品，并按一项目/产品一目录沉淀结论。
doc_type: research-evidence
related:
  - ../../product/positioning-framework-2026-05-30.md
  - ../../knowledge-base/taxonomy.md
  - ../desktop-pet-foundations.md
  - ../existing-pet-products/INDEX.md
---

# AI Pet 框架化竞品与开源项目调研 2026-05-30

## 调研口径

本专题以 2026-05-30 会议形成的产品框架为轴心：AI 情感陪伴型宠物产品，下分“真实宠物关联主线”和“纯电子宠物主线”，共用 AI 聊天、宠物记忆、状态机、桌宠表达、商品推荐和多端入口。

调研分三层：

1. **开源项目**：必须有实际使用体验证据。优先纳入已经在本机跑过、有日志/截图/命令记录的项目。
2. **现有商业产品**：优先使用官方站、官方帮助页、App Store 或厂商支持页核验当前功能。
3. **产品模式**：把单个项目/产品映射到本项目的功能板块，而不是只做竞品摘要。

## 一页结论

1. **MVP 主路径不变**：用 OpenPets 做桌宠可视化和 AI 控制壳，用本项目 Domain Service 承接真实宠物档案、mock 设备数据、照护任务、健康解释和商品推荐。
2. **状态机不要从零想**：codex-pet-companion、DyberPet、tama96 已经给出喂食、玩耍、休息、好感度、背包、冷却、体重/饥饿衰减等可借鉴机制。
3. **真实宠物数据最有价值的是“解释层”**：Tractive、Fi、PetPace、FitBark、Petivity、PETLIBRO Scout 都证明用户愿意看活动、睡眠、行为、生命体征或饮食/排泄数据，但 AI Pet 的机会是把这些数据变成任务、风险说明、问诊证据和桌宠表达。
4. **纯电子宠物不能只做聊天皮肤**：TamaPets、Moflin、EMO、aibo 的共同点是状态、成长、记忆、个性和表达；如果只接 LLM 对话，没有养成和状态变化，会很快变成泛聊天应用。
5. **商业化入口应由任务触发**：Petlibro、Pumpkii、Furbo、PawSpace 展示了摄像头、用品、社区、商城的商业空间；AI Pet 第一版应坚持“库存/健康/照护任务触发推荐”，不做无约束广告流。
6. **健康安全边界必须写进产品**：Tractive 明确声明不是医疗设备；PetPace走 telehealth/telemedicine；AI Pet 只能做趋势解释、风险提示和就医建议，不能做诊断、处方或自动购买。

## 开源项目样本

| 项目 | 本机体验状态 | 对 AI Pet 的角色 | 详细档案 |
|---|---|---|---|
| OpenPets | pass，可运行，CLI/MCP 控制链路成功 | 第一候选桌宠 renderer / AI 控制壳 | [openpets](open-source-projects/openpets/README.md) |
| codex-pet-companion | pass，可运行 | 宠物照护状态机参考 | [codex-pet-companion](open-source-projects/codex-pet-companion/README.md) |
| DyberPet | pass，可运行 | 背包、道具、好感度、自动投喂参考 | [dyberpet](open-source-projects/dyberpet/README.md) |
| AI-Desktop-Pet | partial，前端可跑、后端需环境变量 | Live2D/AI 对话样板 | [ai-desktop-pet](open-source-projects/ai-desktop-pet/README.md) |
| clawd-on-desk | pass，可运行，HTTP 状态接口成功 | AI 状态浮窗和主题系统参考 | [clawd-on-desk](open-source-projects/clawd-on-desk/README.md) |
| PetGPT | pass，Tauri 桌面模式可运行 | AI/MCP 管理台参考 | [petgpt](open-source-projects/petgpt/README.md) |
| tama96 | pass，core 测试和 TUI 可运行 | 严谨虚拟宠物状态机 + AI 权限参考 | [tama96](open-source-projects/tama96/README.md) |
| BongoCat | partial，Tauri 可启动但透明窗口截图不稳定 | Live2D/模型导入方向参考 | [bongocat](open-source-projects/bongocat/README.md) |
| Agentic-Desktop-Pet | partial，后端可跑，Godot 前端未跑 | agent 后端、记忆/情绪参考 | [agentic-desktop-pet](open-source-projects/agentic-desktop-pet/README.md) |
| VPet | fail，macOS 源码构建未通过 | 玩法参考，不作为工程依赖 | [vpet](open-source-projects/vpet/README.md) |

实际体验证据入口：[宠物沙箱 overnight HTML 报告](../../../../reports/pet-sandbox-overnight/index.html)，结构化结果：[run-results.json](../../../../reports/pet-sandbox-overnight/run-results.json)。

## 现有商业产品样本

| 产品 | 类别 | 映射主线 | 对 AI Pet 的启发 | 详细档案 |
|---|---|---|---|---|
| Tractive | GPS + 健康监测 | 真实宠物关联 | 活动、睡眠、RHR/RRR、行为趋势和安全边界 | [tractive](existing-products/tractive/README.md) |
| FitBark | 活动/睡眠 + Developer API | 真实宠物关联 | 公开 API 是 MVP 后续真实设备验证优先对象 | [fitbark](existing-products/fitbark/README.md) |
| PetPace | 医疗级智能项圈 + telehealth | 真实宠物关联 | 生命体征、痛感、压力和兽医共享边界 | [petpace](existing-products/petpace/README.md) |
| Fi Series 3+ | AI GPS 狗项圈 | 真实宠物关联 | 行为识别、vet records、长续航和订阅模型 | [fi](existing-products/fi/README.md) |
| PETLIBRO Scout | AI 宠物摄像头 | 真实宠物关联 | 多宠识别、活动摘要、视频证据 | [petlibro-scout](existing-products/petlibro-scout/README.md) |
| Pumpkii BQ75 | 移动宠物摄像头机器人 | 真实宠物关联 | 远程看护、移动找宠、投食互动 | [pumpkii](existing-products/pumpkii/README.md) |
| Furbo | 宠物摄像头 + AI alerts | 真实宠物关联 | 离家事件、智能提醒和日记型内容 | [furbo](existing-products/furbo/README.md) |
| Petivity | 猫砂盆健康监测 | 真实宠物关联 | 体重、排尿/排便事件和月报 | [petivity](existing-products/petivity/README.md) |
| Moflin | 情绪 AI 机器人宠物 | 纯电子宠物 | 非语言陪伴、情绪地图、成长人格 | [moflin](existing-products/moflin/README.md) |
| Sony aibo | 机器人狗 + 云记忆 | 纯电子宠物 | 云记忆、成长、食物/硬币和长期关系 | [sony-aibo](existing-products/sony-aibo/README.md) |
| EMO | 桌面 AI 机器人宠物 | 纯电子宠物 | 桌面存在感、表情动作和自主探索 | [emo](existing-products/emo/README.md) |
| Loona | 移动 AI petbot | 纯电子宠物 | 具身移动、视觉/语音/GPT 交互 | [loona](existing-products/loona/README.md) |
| TamaPets | AI 虚拟宠物 App | 纯电子宠物 | Gemini Live、状态衰减、进化、表情和冒险 | [tamapets](existing-products/tamapets/README.md) |
| PawSpace | 宠物社交 + AI Health + marketplace | 共享能力/商业化 | 社区、健康、商城、丢宠和匹配合一 | [pawspace](existing-products/pawspace/README.md) |

## 对产品框架的归纳

### 真实宠物关联主线

应把设备数据抽象成四类证据：

- **安全证据**：GPS、Virtual Fence、离家提醒、异常活动。
- **健康趋势**：活动、睡眠、心率、呼吸、体温、体重、排泄。
- **行为事件**：抓挠、吠叫、舔舐、饮食、饮水、猫砂盆访问。
- **照护记录**：喂食、换水、用药、换粮、洗澡、伤口观察、库存变化。

MVP 先用 mock 和手动记录模拟这些证据，输出日/周报告、照护任务和桌宠提醒；真实 API 优先选择 FitBark 这类有开发者入口的设备。

### 纯电子宠物主线

不能只做“宠物皮肤 + LLM”。必须补齐：

- 状态衰减：饥饿、精力、心情、清洁、亲密度。
- 互动收益：喂食、玩耍、聊天、休息、装扮。
- 成长机制：等级、进化、个性变化、长期记忆。
- 表达系统：桌宠动作、表情、气泡、声音、触摸反馈。
- 商业入口：装扮、道具、现实同款、订阅或增值服务。

### 共享能力层

应沉淀为可复用模块：

- `PetProfile`：真实宠物档案或纯电子宠物设定。
- `PetState`：状态机，不依赖具体渲染层。
- `EvidenceTimeline`：设备、手动、视频、聊天、库存事件。
- `TaskPlanner`：从证据生成照护/互动任务。
- `ExpressionAdapter`：把状态/任务映射为 OpenPets/Live2D/机器人表达。
- `RecommendationAdapter`：由库存、健康约束和任务触发商品推荐。

## 推荐下一步

1. 确认 MVP 仍以 OpenPets + 本项目 Domain Service 为主路径。
2. 把 codex-pet-companion / DyberPet / tama96 中的状态机概念整理成 `modules/pet-state-machine.md`。
3. 把 Tractive / Fi / FitBark / PetPace / Petivity 的数据字段抽象为 `modules/evidence-timeline.md`。
4. 把 TamaPets / Moflin / EMO / aibo 的纯电子宠物机制整理为二阶段功能池。
5. 把商品推荐限制写进 `modules/commerce-recommendation.md`，明确由任务/库存/健康约束触发。

## 来源说明

商业产品事实来自 2026-05-30 联网核验，以官方站、官方帮助页、厂商支持页、App Store 和官方 GitHub/GitHub API 为主。开源项目体验证据来自本地 `reports/pet-sandbox-overnight/` 的命令、日志、截图和结构化结果；GitHub stars/license/pushed_at 通过 `gh api repos/...` 于 2026-05-30 查询。

