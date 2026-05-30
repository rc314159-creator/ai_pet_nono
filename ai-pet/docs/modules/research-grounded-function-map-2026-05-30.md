---
title: AI Pet 基于现有产品和开源项目的功能映射
description: 将已调研的开源项目、商业产品和游戏机制映射为 AI Pet 要开发的功能大类和具体功能。
status: 已批准
created: 2026-05-30
updated: 2026-05-30
update_reason: 根据 MVP 功能设计讨论同步桌宠主入口和应用窗口口径。
doc_type: module-spec
domain_taxa:
  - capability
  - research-to-product
  - development-alignment
related:
  - function-scope-2026-05-30.md
  - ../research/framework-comparative-research-2026-05-30/INDEX.md
  - ../research/pet-game-ai-projects/INDEX.md
  - ../research/desktop-pet-foundations.md
  - ../research/agent-foundations.md
  - ../plan/mvp-feature-design-2026-05-30.md
---

# AI Pet 基于现有产品和开源项目的功能映射

## 使用原则

功能开发必须基于已调研的现有产品、开源项目和可验证模式。不能只按抽象产品想象拆功能。

每个功能大类都要回答：

1. 对标/借鉴哪些现有产品或开源项目。
2. 这些项目已经证明了什么能力。
3. AI Pet 要复用、抽象或改造什么。
4. 哪些能力不直接照搬。

## 一页功能来源图

| AI Pet 功能大类 | 主要现有依据 | 我们开发什么 |
|---|---|---|
| 桌面宠物核心入口 | OpenPets、EMO、Moflin、aibo、Loona、AI-Desktop-Pet、BongoCat | 系统级桌宠、气泡、动作、状态表达、轻交互 |
| Agent 智能交互 | opencode、PetGPT、tama96、Agentic-Desktop-Pet、clawd-on-desk | 成熟 agent + 受控宠物业务工具 |
| 宠物状态与养成 | codex-pet-companion、DyberPet、tama96、Tamagotchi、Pou、My Talking Tom、TamaPets | 饱腹、心情、精力、清洁、亲密度、成长、冷却、道具 |
| 真实宠物数据证据流 | Tractive、FitBark、PetPace、Fi、Petivity、PETLIBRO Scout、Furbo、Pumpkii | 活动、睡眠、心率、呼吸、体温、GPS、抓挠、吠叫、饮食/排泄事件 |
| 健康解释与照护任务 | Tractive、PetPace、Petivity、Maven、Furbo、Joii/Petriage 类分诊产品 | 趋势解释、异常归因、今日任务、问诊证据摘要 |
| 纯电子宠物陪伴 | Moflin、aibo、EMO、Loona、TamaPets、AI-tamago、tama96 | 个性、记忆、状态变化、成长反馈、非单纯聊天 |
| 商品推荐与换装 | PawSpace、Petlibro、Chewy/Petco/BARKBox 类路径、DyberPet 背包、Neopets/Webkinz 经济 | 库存/任务/状态触发推荐，装扮、道具、护理用品 |
| 社区/挑战/分享 | PawSpace、PetMeet、Petzbe、BringFido、Adopt Me、Neopets | 轻量挑战、排行榜、分享卡，不先做大社区 |
| 多端入口 | PawSpace/移动 App、TamaPets/App、Webkinz/网页世界、OpenPets/桌面、通讯软件入口设想 | 桌宠 + 点击后应用窗口优先，后续 H5/PWA、飞书/微信、小程序/App |

## 1. 桌面宠物核心入口

现有依据：

- OpenPets：本机实测可运行，有桌面宠物窗口、CLI/MCP/IPC 控制链路。
- EMO、Moflin、aibo、Loona：证明“宠物存在感”来自常驻、动作、表情、个性和主动反馈。
- AI-Desktop-Pet、BongoCat：证明 Live2D/模型表达可作为高级形象方向。

要开发：

- 基于 OpenPets 启动系统级桌宠。
- 支持 `status/say/react/move` 等控制。
- 将宠物状态、任务、Agent 输出映射为气泡和动作。
- 让桌宠成为可操作入口：点击展开应用窗口、提醒确认、任务反馈。

不照搬：

- 不自研桌宠运行时。
- 不先做复杂机器人或 AR。
- 不把桌宠降级成应用窗口的装饰组件。

## 2. Agent 智能交互

现有依据：

- opencode：成熟 agent runtime，适合接 MCP tools。
- PetGPT：Tauri 桌面模式和 MCP 管理能力可参考。
- tama96：轻量虚拟宠物状态机 + AI 权限思路。
- Agentic-Desktop-Pet、clawd-on-desk：状态浮窗、agent 后端、记忆/情绪表达参考。

要开发：

- OpenCode SDK / opencode runtime 接入。
- 宠物业务 tools：档案、状态、证据、任务、互动、桌宠表达、推荐。
- Agent 通过工具回答问题、生成任务、触发桌宠。

不照搬：

- 不自己写 agent 框架。
- 不暴露通用 shell/file 工具给宠物用户。
- 不做只拼 prompt 的聊天框。

## 3. 宠物状态与养成

现有依据：

- codex-pet-companion：Fullness、Mood、Energy、Friendship、Feed、Play、Rest。
- DyberPet：item、backpack、favorability、auto feed、dialogue、mini-pet。
- tama96：严谨虚拟宠物状态、生命周期和 AI 权限。
- Tamagotchi、Pou、My Talking Tom、TamaPets：低摩擦日常照护、状态条、互动、成长和装扮。

要开发：

- 统一 `PetState`：饱腹、心情、精力、清洁、亲密度、成长、健康 flag。
- 互动事件：喂食、玩耍、护理、休息、聊天、装扮。
- 状态衰减和互动收益。
- 真实宠物数据和纯电子宠物玩法共用状态机。

不照搬：

- 不先做复杂繁殖、抽卡、Roblox 交易经济。
- 不把 AI 宠物做成只有聊天皮肤。

## 4. 真实宠物数据证据流

现有依据：

- Tractive、Fi：GPS、安全围栏、活动、睡眠、行为趋势。
- FitBark：活动/睡眠和 Developer API 方向。
- PetPace：心率、呼吸、体温、压力、痛感等生命体征表达。
- Petivity：猫砂盆体重、排尿、排便事件和月报。
- PETLIBRO Scout、Furbo、Pumpkii：摄像头、活动摘要、离家提醒、投食/远程互动。

要开发：

- `EvidenceTimeline`：统一设备、手动、库存、互动、图片/视频事件。
- Mock 设备数据字段覆盖活动、睡眠、心率、呼吸、体温、GPS、安全围栏、抓挠、吠叫、饮食/排泄。
- 证据影响状态、任务和 Agent 回答。

不照搬：

- 不等待真实硬件 API 审核。
- 不把某一个硬件生态写死为唯一数据源。

## 5. 健康解释与照护任务

现有依据：

- Tractive、Fi、FitBark：将活动/睡眠趋势转成用户可理解信息。
- PetPace、Petivity：基线变化、异常趋势和报告。
- Furbo/PETLIBRO：事件日记、离家提醒和视频证据。
- Joii/Petriage 类产品：分诊、风险提示、就医建议模式。

要开发：

- 从证据流生成今日任务：喂食、换水、遛狗、清洁、护理、休息、补货。
- Agent 解释任务原因和异常趋势。
- 单日摘要和可选周/月趋势。
- 问诊/复盘证据摘要。

不照搬：

- 不做医疗诊断产品。
- 不以安全边界作为当前讨论焦点，但实现上保留风险提示和人工确认底线。

## 6. 纯电子宠物陪伴

现有依据：

- Moflin：情绪地图、非语言陪伴、成长人格。
- aibo：云记忆、成长、长期关系。
- EMO：桌面存在感、表情动作、自主探索。
- Loona：视觉/语音/GPT 交互和具身移动方向。
- TamaPets、AI-tamago、tama96：AI 聊天 + 经典照护循环。

要开发：

- 虚拟宠物档案、人设、初始状态。
- 聊天、喂食、玩耍、清洁、休息、装扮。
- 亲密度、成长、偏好和冷落反馈。
- 与真实宠物分身共用状态机和桌宠表达。

不照搬：

- 不做单独割裂的第二产品。
- 不做实体机器人供应链。

## 7. 商品推荐与换装

现有依据：

- PawSpace：宠物社区、健康和 marketplace 组合。
- Petlibro、Furbo、Pumpkii：硬件、用品、远程互动形成商业入口。
- Chewy/Petco/BARKBox 类路径：补货、订阅、用品、服务。
- DyberPet、Neopets、Webkinz：背包、道具、装扮和虚拟经济。

要开发：

- MVP 先做内置模板换装，换装结果同步到对话主页和桌宠。
- 库存管理：剩余量、阈值、补货任务。
- 任务/状态/库存触发推荐作为后续商业化入口。
- 推荐卡片：原因、适配条件、禁忌检查、操作入口。
- 装扮：先支持电子宠物装扮，真实宠物试装作为增强方向。

不照搬：

- 不做无约束广告流。
- 不先做完整 marketplace、订单、支付和售后系统。

## 8. 社区、挑战与分享

现有依据：

- PawSpace、PetMeet、Petzbe：宠物社交、健康、商城、社区组合。
- BringFido：工具型目录和宠物友好场景。
- Adopt Me、Neopets：宠物身份、任务、社区和经济长期运营。

要开发：

- 轻量挑战：运动、护理、训练、连续陪伴。
- 排行榜或成就卡。
- 分享卡：今日报告、任务完成、装扮效果。

不照搬：

- 不先做大社区、UGC 审核、交易市场。
- 不把社区作为当前核心闭环。

## 9. 多端入口

现有依据：

- OpenPets：桌面入口。
- PawSpace、TamaPets：移动 App 入口。
- Webkinz、Neopets：网页虚拟世界。
- 会议讨论：飞书/微信等通讯软件入口可行。

要开发：

- 当前必须跑通系统级桌宠 + 点击桌宠后弹出的应用窗口。
- 后续端口复用同一 `Domain Service` 和 `Agent tools`。
- H5/PWA、飞书/微信、小程序、App 作为统一入口，而非重写业务。

不照搬：

- 不先做多套业务逻辑。
- 不因为多端入口分散当前桌宠 + 应用窗口核心闭环。

## 当前开发判断

基于现有调研，当前最稳的开发主路径是：

1. OpenPets 做桌宠核心入口。
2. opencode/OpenCode SDK 做成熟 Agent 入口。
3. codex-pet-companion、DyberPet、tama96 抽状态机、道具、好感度和照护循环。
4. Tractive、FitBark、PetPace、Fi、Petivity、Furbo、PETLIBRO 抽证据字段和健康解释模式。
5. TamaPets、Moflin、EMO、aibo 抽纯电子宠物的成长、个性、记忆和表达。
6. PawSpace、Petlibro、Chewy/Petco/BARKBox 类路径抽商品推荐、商城和社区入口，但只做任务/库存/状态触发的最小闭环。
