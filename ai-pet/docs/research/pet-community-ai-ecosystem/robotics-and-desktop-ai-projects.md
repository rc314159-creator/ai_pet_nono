---
title: 机器人、虚拟宠物与开源桌宠项目逐项调研
description: AI 机器人宠物、虚拟宠物、开源桌宠和 agent 桌宠项目调研。
status: 起草中
created: 2026-05-30
updated: 2026-05-30
update_reason: 新增机器人与桌宠方向项目调研
related:
  - ai-pet/docs/research/desktop-pet-foundations.md
  - ai-pet/docs/research/agent-repo-scan-2026-05-29.md
---

# 机器人、虚拟宠物与开源桌宠项目逐项调研

## Moflin

- 来源：[Casio Moflin](https://www.casio.com/us/moflin/)
- 类型：AI 情绪陪伴机器人宠物。
- 核心机制：情绪、成长、个性、MofLife app、声音/触摸互动、充电床。
- AI 结合：emotional AI、响应互动、学习主人声音和互动方式、个性随照护成长。
- 对 MVP 启发：虚拟宠物要有“成长/个性/关系记忆”，不能只有状态条；桌宠需要有被冷落、被照护后的状态变化。
- 风险：解决陪伴，不解决真实宠物健康；硬件价格和可用地区限制。
- 适配度：B。

## Familiar Machines & Magic

- 来源：[familiarmachines.com](https://www.familiarmachines.com/)、[AP News](https://apnews.com/article/da873ddff1ebcc95f793852b8e53d2d2)
- 类型：pet-inspired physical AI companion。
- 核心机制：四足/毛绒原型、家庭陪伴、社交推理、非人非猫狗形态。
- AI 结合：新一代 embodied AI 和社会性陪伴。
- 对 MVP 启发：AI 宠物形态不一定复刻真实宠物；但本项目仍以“真实宠物数字分身”为主，应优先保持真实宠物映射。
- 风险：2026-05 仍处于原型/发布早期，产品化细节不足。
- 适配度：C。

## Sony aibo

- 来源：[Sony Design aibo](https://www.sony.com/en/SonyInfo/design/gallery/aibo/)、[Sony Help Guide](https://helpguide.sony.net/aibo/ers1000/v1/en-us/contents/TP0001970078.html)
- 类型：经典 AI 机器狗。
- 核心机制：机器人狗形态、传感器、摄像头、麦克风、动作和云连接。
- AI 结合：自主行为、识别和成长式互动。
- 对 MVP 启发：aibo 证明“机器宠物感”来自动作细节、持续关系和硬件存在感；桌宠也需要稳定在场。
- 风险：封闭硬件生态，不适合 MVP 集成。
- 适配度：C。

## Loona

- 来源：[KEYi Loona guide](https://www.keyirobot.com/blogs/loona-tutorials/what-is-loona-petbot-a-complete-guide-to-smart-ai-robot-pet)
- 类型：移动 AI robot pet。
- 核心机制：3D ToF、RGB camera、face/gesture/object recognition、petting sensors、voice/chat、remote FPV。
- AI 结合：emotional AI、LLM/GPT chat、edge processing、smart home。
- 对 MVP 启发：互动反馈要结合表情、动作、声音和环境事件；桌宠虽是屏幕/窗口，也应组合动作和语音气泡。
- 风险：官方 blog 带营销成分；隐私和联网依赖要验证。
- 适配度：B。

## Enabot EBO X

- 来源：[Enabot EBO X](https://store.enabot.com/products/ebo-x-familybot)
- 类型：家庭/宠物移动摄像头和陪伴机器人。
- 核心机制：移动监控、远程通话、家庭陪伴、Alexa/GPT 相关更新、宠物互动。
- AI 结合：家庭机器人、语音助手、移动观察。
- 对 MVP 启发：真实宠物在家状态可以通过移动相机触发远程照护；MVP 可以先抽象 camera mock，不接硬件。
- 风险：机器人导航、摄像头隐私、硬件成本。
- 适配度：B。

## OpenPets

- 来源：[GitHub alvinunreal/openpets](https://github.com/alvinunreal/openpets)
- 类型：桌面宠物平台，面向 AI coding agents。
- GitHub 状态：2026-05-30 搜索时约 979 stars，TypeScript，活跃更新。
- 核心机制：桌面宠物窗口、pet packs、CLI/MCP/IPC 控制、agent session 状态反应。
- AI 结合：通过 agent/MCP 控制宠物说话、状态和动作。
- 对 MVP 启发：仍是 AI Pet MVP 的系统级桌宠底座首选；本项目只需要叠加真实宠物档案、健康和任务语义。
- 风险：原始目标是 coding agent，不是宠物照护；需要业务 adapter。
- 适配度：A。

## Agentic-Desktop-Pet

- 来源：[GitHub jihe520/Agentic-Desktop-Pet](https://github.com/jihe520/Agentic-Desktop-Pet)
- 类型：LLM + 记忆 + 情感 + RPG 的 agentic 桌宠。
- GitHub 状态：2026-05-30 搜索时约 288 stars，Python，活跃更新。
- 核心机制：LLM、memory、emotion、RPG、Claude Code 相关桌宠。
- AI 结合：更强调情感和记忆，而不仅是状态显示。
- 对 MVP 启发：可参考记忆/情绪状态设计；不作为底座替代 OpenPets。
- 风险：项目成熟度、本地运行和跨平台稳定性未验证。
- 适配度：B。

## Clawd-on-desk

- 来源：[GitHub rullerzhou-afk/clawd-on-desk](https://github.com/rullerzhou-afk/clawd-on-desk)
- 类型：观察 Claude Code/Codex/Cursor 等 AI coding agents 的 pixel desktop pet。
- GitHub 状态：2026-05-30 搜索时约 3298 stars，JavaScript，极高关注。
- 核心机制：桌面宠物展示 AI agent 状态。
- AI 结合：agent 状态可视化，不是宠物照护 AI。
- 对 MVP 启发：证明“AI 工作状态 -> 可爱桌宠反馈”的传播力；AI Pet 可把“真实宠物状态 -> 桌宠反馈”做成类似情感界面。
- 风险：主题偏开发者生产力，与真实宠物用户不同。
- 适配度：B。

## MiniCPM-Desk-Pet

- 来源：[GitHub OpenBMB/MiniCPM-Desk-Pet](https://github.com/OpenBMB/MiniCPM-Desk-Pet)
- 类型：local-first desktop pet powered by MiniCPM5。
- GitHub 状态：2026-05-30 搜索时约 207 stars，JavaScript，活跃更新。
- 核心机制：本地模型桌宠。
- AI 结合：本地 LLM/多模态能力和桌宠体验。
- 对 MVP 启发：未来可研究本地小模型做隐私敏感的宠物状态摘要或轻问答。
- 风险：第一版指定 llmmelon 中转站，不应引入本地模型主线复杂度。
- 适配度：C。

## ZcChat

- 来源：[GitHub Zao-chen/ZcChat](https://github.com/Zao-chen/ZcChat)
- 类型：模仿 Galgame 效果的 AI 桌宠。
- GitHub 状态：2026-05-30 搜索时约 540 stars，C++，活跃更新。
- 核心机制：角色对话、视觉演出、桌宠窗口。
- AI 结合：AI 角色聊天。
- 对 MVP 启发：对话演出和角色状态表现可参考；不解决真实宠物数据绑定。
- 风险：角色恋爱/二次元方向与宠物照护不同。
- 适配度：C。

## Live2DPet

- 来源：[GitHub x380kkm/Live2DPet](https://github.com/x380kkm/Live2DPet)
- 类型：AI-powered Live2D desktop pet with VOICEVOX TTS。
- GitHub 状态：2026-05-30 搜索时约 58 stars，JavaScript，活跃更新。
- 核心机制：Live2D、TTS、桌宠交互。
- AI 结合：AI 对话和语音反馈。
- 对 MVP 启发：第二阶段高级形象模式可参考 Live2D/TTS，但第一版不应阻塞在模型制作。
- 风险：Live2D 资产和授权复杂；不是真实宠物数字分身。
- 适配度：C。

## Tiny Roommate

- 来源：[GitHub ryannli/tiny-roommate](https://github.com/ryannli/tiny-roommate)
- 类型：轻量 AI desktop pet。
- GitHub 状态：2026-05-30 搜索时约 32 stars，JavaScript，活跃更新。
- 核心机制：桌面小宠物、陪伴式聊天。
- AI 结合：轻量 AI 桌宠。
- 对 MVP 启发：可作为小体量交互参考；核心能力不足以替代 OpenPets。
- 风险：规模小、项目成熟度有限。
- 适配度：C。

