---
title: AI Pet 宠物名字与系统提示词无法在 App 内修改问题记录
description: 记录用户反馈当前 App 只有默认宠物身份和默认系统提示词，但缺少应用内设置入口、持久化配置和 Agent prompt 覆盖机制。
status: 已修复
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - app-window
  - pet-profile
  - agent-runtime
  - prompt-library
  - persistence
related:
  - ../product/product-spec-2026-05-30.md
  - ../architecture/product-logic-framework-2026-05-31.md
  - ../architecture/current-system-architecture-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../modules/agent-chat-2026-05-30.md
  - ../modules/live-knowledge-base-2026-05-31.md
  - ../modules/pet-settings-and-persona-2026-05-31.md
---

# AI Pet 宠物名字与系统提示词无法在 App 内修改问题记录

## 事实时间线

- 2026-05-31，用户指出：以前这个 App 里似乎没有办法对名字之类的内容做设置，也没有办法修改系统提示词；现在虽然有默认设置，但仍然无法修改。
- 2026-05-31，用户进一步澄清：问题重点不是缺少默认配置，而是 App 端没有可编辑入口；当前先记录想法并讨论，不进入代码实现。
- 2026-05-31，用户进一步强调：如果做 App 端编辑，就必须把数据保存下来，并保证 App UI、Agent、桌宠、对话历史和后续运行时配置一致连贯，不能只做一个表面编辑页。
- 2026-05-31，已按“先知识库、再开发、最后端到端验证”流程完成 Demo 阶段实现：App 端设置入口、settings store、API、Agent runtime、MCP、知识库、桌宠链路和 Electron 验证均已接入。
- 当前产品规格要求对话页可见宠物名字和头像必须来自同一份 `PetProfile` 显示身份，当前 Demo 显示为“旺财”。
- 当前“我的”页展示了宠物档案、宠物知识库、用户激励和装扮入口，但没有宠物资料编辑、主人称呼编辑、Agent 角色/提示词编辑或保存入口。
- 当前系统提示词已经有默认实现，但主要是源码/Prompt 文件内的静态默认值，不是用户可在 App 内修改的运行时配置。

## 证据引用

- `src/domain/mockData.ts`：`petProfiles[0]` 写死 `name: "Mochi"`、`displayName: "旺财"`、品种、年龄、饮食、性格和头像。
- `src/app/App.tsx`：应用根组件直接使用 `const profile = petProfiles[0]`，后续聊天、状态、市集、社区和“我的”页都从该常量派生显示身份。
- `server/petRuntimeSnapshot.ts`：后端 runtime snapshot 也直接使用 `const profile = petProfiles[0]`，Agent 和 MCP 读取到的仍是静态 mock 档案。
- `src/domain/agent.ts`：`techDogPersona` 定义默认角色卡、说话风格、运行规则和 TTS 指令；`getPersonaForProfile()` 只把 `PetProfile.displayName` 替换进默认 persona，没有读取用户自定义 persona。
- `.opencode/prompts/ai-pet-companion.md`：OpenCode/opencode 主 Prompt 是静态文件，写入默认“旺财”角色卡和行为边界。
- `server/index.ts`：健康、桌宠状态、`/api/desktop-pet/say` 等接口仍有 `desktopPetDisplayName: "旺财"`、`authorName: "旺财"`、`authorName: "主人"` 等硬编码。
- 现有持久化 store 覆盖了 thread、appearance、knowledge-base，但没有 profile/settings/persona/prompt store。

## 根因

当前实现把“Demo 默认档案”和“用户可配置档案”混在一起了。

具体根因：

- `PetProfile` 是领域对象，但当前来源仍是 `mockData.ts` 静态数组，不是可读写的配置 store。
- 前端和后端各自直接读 `petProfiles[0]`，缺少统一 `ProfileService` 或 `/api/pet-profile` API。
- Dog Persona 和系统提示词以源码常量、静态 Markdown Prompt 文件和少量后端拼接文本存在，缺少“默认 Prompt + 用户覆盖项 + 运行时合成”的分层。
- “我的”页目前是展示和装扮承载页，没有独立“宠物资料/对话设置”表单，也没有保存后同步到 thread、桌宠气泡、TTS、OpenCode prompt 的闭环。
- 现有 memory 用于长期对话事实，不能替代用户配置；把名字或系统提示词只写 memory 会导致 UI、桌宠、Agent runtime 和 TTS 仍然不一致。

## 正确设计

应新增一个应用内设置层，而不是继续把默认 mock 当成真相源。该层的用户价值是：用户可以直接在 App 中改宠物身份、称呼和角色表达，不需要开发者改源码、改 `.opencode/prompts` 或重启默认配置。

本记录只保留问题发现和讨论过程。当前权威模块契约已提升到 [AI Pet 宠物资料、App 设置与 Persona 配置模块](../modules/pet-settings-and-persona-2026-05-31.md)，整体架构约束已写入产品逻辑、当前系统架构、技术架构、对话页 Agent 模块和应用内知识库模块。后续开发不得只依据本修复记录执行。

建议拆成三类设置：

1. 宠物身份设置：宠物显示名、真实名、物种、品种、年龄、体重、头像、主人称呼、家庭群名称。
2. 宠物性格/表达设置：性格标签、说话风格、口癖、主动提醒强度、语音偏好、TTS 音色。
3. 高级 Agent 设置：系统提示词补充说明、禁用词/边界、自定义示例对话、恢复默认 Prompt。

数据层建议：

- Demo 阶段新增 `.ai-pet-data/settings.json` 或 `.ai-pet-data/profile-settings.json`。
- 后端提供 `GET /api/settings`、`PATCH /api/settings/profile`、`PATCH /api/settings/persona`、`POST /api/settings/reset`。
- `buildPetRuntimeSnapshot()`、MCP `get_pet_profile`、`getPersonaForProfile()`、OpenCode/opencode prompt adapter、TTS 和桌宠气泡作者名都读取同一份 merged settings。
- 默认值来自 `mockData.ts` 和默认 persona；用户配置只保存 override，避免默认 Prompt 更新时被整段复制污染。

UI 建议：

- 在“我的”页新增“宠物资料/对话设置”入口，而不是塞进对话页。
- 普通用户默认只看到宠物名称、头像、主人称呼、性格标签、语气强度等安全设置。
- 系统提示词放到“高级设置”折叠页，提供恢复默认、预览合成 Prompt 和最小校验，避免误删必要工具规则。
- 保存后需要立即更新：我的页档案、对话页群名和消息作者、桌宠气泡作者、Agent 后端 snapshot、OpenCode Prompt 输入、TTS 指令和知识库身份档案。

当前已完成实现，权威契约见 [AI Pet 宠物资料、App 设置与 Persona 配置模块](../modules/pet-settings-and-persona-2026-05-31.md)。

## 一致性链路

App 端编辑不是局部 UI 功能，必须贯穿以下链路：

1. 用户在应用窗口“我的 -> 宠物资料/对话设置”中编辑并保存。
2. 后端 settings/profile store 持久化配置，Demo 阶段可用本地 JSON，生产阶段迁移正式数据库。
3. 前端重新读取 merged settings，刷新我的页、对话页群名、输入 placeholder、消息作者名和知识库身份档案。
4. `buildPetRuntimeSnapshot()` 读取同一份 merged settings，保证 Agent、MCP tools 和主动事件看到的是新身份。
5. Prompt 合成器把默认系统 Prompt、默认 Dog Persona、用户自定义 persona override 和当前宠物档案合成成运行时 Prompt。
6. 桌宠气泡继续展示 `ThreadMessage.text`；新消息的 `authorName` 使用保存后的当前宠物显示名。
7. TTS 指令读取当前 persona/voice settings，避免文字角色和语音角色不一致。
8. 历史消息保留原作者名，新消息使用新名字；必要时在 thread store 写一条系统不可见或知识库可见的“资料已更新”事件，解释身份变化。

验收标准：

- 修改宠物显示名后，App 我的页、聊天群名、新消息作者、桌宠气泡作者、Agent 自称、MCP `get_pet_profile` 返回值一致。
- 修改主人称呼后，下一轮 Agent 回复和 prompt context 使用新称呼。
- 修改角色设定补充后，下一轮 Agent 回复体现新风格，但不会丢失动作工具、记忆工具和 Dog Persona 边界。
- 重启 App 后设置仍然存在。
- Electron 完整链路验证通过，不能只用浏览器 renderer 验证。

## 当前代码链条

当前实现里，宠物身份和 persona 入口分散在多处：

1. 应用窗口根组件：`src/app/App.tsx` 直接执行 `const profile = petProfiles[0]`。
2. 应用窗口状态：`profile` 派生出 `profileIdentity`、`agentContext`、群聊 `threadId`、市集/社区/状态/我的页展示名。
3. 对话页：`ChatHome` 使用 `getPersonaForProfile(profile)` 生成群名、消息作者、输入框 placeholder、等待态和本地 fallback。
4. 对话发送：`ChatHome` 把 `{ ...context, mainThreadId: threadId }` 发给 `/api/agent/chat`；因此用户发起对话时，后端主要信任前端传来的 profile context。
5. 后端对话：`server/agent.ts` 的 `createPetAgentReply()` 用 payload context 生成 snapshot、persona、memory、history，并调用 OpenCode/opencode、OpenAI Agents fallback 或本地 persona fallback。
6. OpenCode adapter：`server/opencodeAgent.ts` 用 `getPersonaForProfile(snapshot.profile)` 和 `compactPetSnapshot(snapshot)` 拼接运行时 prompt，再调用 `.opencode/prompts/ai-pet-companion.md` 声明的 agent。
7. 主动事件 runtime：`server/petEventRuntime.ts` 不依赖前端 context，而是在模块加载时用 `const mainProfile = petProfiles[0]` 和 `defaultThreadId`，Cron/Hook 默认走这套静态 profile。
8. MCP snapshot：`server/petRuntimeSnapshot.ts` 也直接读 `petProfiles[0]`，所以 `ai_pet_get_pet_profile` 仍会返回静态 mock profile。
9. Thread store：`server/threadStore.ts` 保存的是消息和 memory，不保存当前 profile/persona settings。
10. Knowledge base：`server/knowledgeBase.ts` 默认身份档案也从 `petProfiles[0]` 派生。
11. 桌宠气泡：`desktop/photo-pet/runtime.js` 读取 `/api/desktop-pet/bubble` 返回的最新 `ThreadMessage.text`；气泡文本来自 thread message，但消息 `authorName` 在入库时已经由当时 persona 决定。

因此，如果只在前端做编辑，会出现：

- 我的页显示新名字，但 MCP/主动 Cron 仍然使用旧名字。
- 用户发起对话可能用新名字，后台主动提醒仍用旧名字。
- 对话页群名可能变了，但 OpenCode 静态 prompt 仍带默认“旺财”角色卡。
- TTS 指令仍可能保留旧“科技狗/旺财”描述。
- 知识库身份档案仍显示旧 profile。

## 开发顺序

正确开发顺序应从数据真相源开始，而不是从 UI 开始：

1. 新增 `SettingsStore` 和类型：保存 `profileOverride`、`ownerOverride`、`personaOverride`、`voiceOverride`，Demo 阶段落 `.ai-pet-data/settings.json`。
2. 新增纯函数 `getMergedPetSettings()` / `getActivePetProfile()` / `getActivePersona()`：输入默认 `petProfiles[0]`、默认 `techDogPersona` 和 overrides，输出统一 profile/persona。
3. 改造后端读取点：
   - `server/petRuntimeSnapshot.ts` 改为读 merged profile。
   - `server/petEventRuntime.ts` 的 `mainProfile/defaultThreadId/buildDefaultContext()` 改为每次 tick 动态读取 merged profile，不能模块加载时固定。
   - `server/knowledgeBase.ts` 默认身份档案改为读 merged profile。
   - `/api/desktop-pet/status`、`/api/desktop-pet/say`、`/api/agent/chat` 入库 authorName 改为读 active persona/owner。
4. 新增 settings API：
   - `GET /api/settings`
   - `PATCH /api/settings/profile`
   - `PATCH /api/settings/persona`
   - `POST /api/settings/reset`
5. 改造前端根组件：启动时先读 settings，merged profile 进入 `agentContext`；保存后刷新本地状态并重新渲染我的页、对话页和知识库。
6. 改造 Prompt 合成：用户自定义内容只作为 persona override 注入，不能覆盖工具规则、动作规则、记忆规则和工程词禁令。
7. 最后实现“我的 -> 宠物资料/对话设置”UI。

## 验证计划

验证必须覆盖单元、接口和 Electron App 链路：

1. 单元/纯函数：
   - 默认 settings 为空时，merged profile 等于当前 Demo 默认值。
   - 修改 `displayName`、`ownerDisplayName`、`personaStyle` 后，merged profile/persona 只改变预期字段。
   - reset 后恢复默认。
2. API 验证：
   - `PATCH /api/settings/profile` 后 `GET /api/settings` 持久返回新值。
   - 重启 API 后新值仍存在。
   - `GET /api/agent/status`、MCP `get_pet_profile` 或等价 snapshot 返回新 profile。
3. 对话链路：
   - 修改宠物名后发送一条消息，`GET /api/agent/threads/:threadId/messages` 中新宠物消息 `authorName` 是新名字。
   - 修改主人称呼后，用户消息 `authorName` 和下一轮 Agent prompt context 使用新称呼。
   - 修改 persona 补充后，下一轮 Agent 回复体现风格变化，但动作请求仍触发 `request_pet_motion`。
4. 主动事件链路：
   - 修改宠物名后调用 `POST /api/agent/cron/tick`，生成的 proactive/thread message 使用新名字和新 persona。
   - 调用 `POST /api/agent/hooks` 触发 `appearance.changed` 或 `owner.returned`，输出仍是新 persona。
5. 知识库链路：
   - 保存设置后，应用内知识库“身份档案”刷新为新名字/新资料。
6. Electron E2E：
   - 使用 `npm run dev` 启动完整桌宠 App。
   - 从桌宠打开应用窗口，进入“我的 -> 宠物资料/对话设置”保存新名字。
   - 切到对话页确认群名、placeholder、新消息作者变化。
   - 关闭应用窗口恢复桌宠，触发新消息，确认桌宠气泡文本来自新 thread message。
   - 重启 App 后设置仍然存在。

## 修复计划

1. 已确认产品口径：App 暴露“角色与提示词补充”，不允许完整替换底层系统 Prompt 和工具边界。
2. 已新增 `src/domain/settings.ts` 和 `server/settings.ts`，默认从现有 `petProfiles[0]` 与 `techDogPersona` 派生，用户配置只保存 override。
3. 已新增 settings API，并让前端、后端 runtime snapshot、MCP、知识库、桌宠状态和聊天入库统一读取 merged settings。
4. 已改造“我的”页：增加“资料设置”入口，提供基础资料、角色提示词和声音设置编辑。
5. 已改造 Agent prompt 生成：用户自定义内容作为 persona override 注入，默认工具规则、动作规则、记忆规则和工程词禁令继续保留。
6. 保存设置时已写入知识库事件，并刷新应用内知识库身份档案条目。
7. 已用 Browser renderer 和 Electron `desktop/photo-pet` 完整链路验证：修改名字后我的页、对话群名、placeholder、新消息作者、Agent 回复、桌宠打开的应用窗口和知识库身份档案一致变化。

## 验证结果

- `npm run typecheck`：通过。
- `npm run build`：通过。
- API：`PATCH /api/settings` 后 `GET /api/settings` 持久返回新值；`/api/health`、`/api/desktop-pet/status`、`/api/desktop-pet/bubble`、`/api/agent/chat` 使用新宠物显示名和主人称呼。
- Browser renderer：保存“小青 / 家长 / 小青家庭群”后，对话页新回复为“小青在呀，家长”，console/network 无新错误。
- Electron App：从桌宠打开应用窗口，保存“小蓝 / 饲养员 / 小蓝家庭群”后，对话页群名、输入 placeholder、新消息作者和 Agent 自称均使用新设置。

## 待讨论问题

- 系统提示词编辑应面向开发展示，还是面向真实用户？真实用户可能更适合“性格/语气/禁忌”表单，完整 Prompt 只放高级模式。
- 是否允许用户完整覆盖系统提示词？建议不允许。完整覆盖容易破坏工具调用、动作边界、隐私边界和 Dog Persona 规则；更稳的是“默认系统 Prompt + 用户补充 persona + 示例对话”。
- 是否需要多宠物管理？当前 Demo 可以只支持当前宠物，但数据结构应按 `petId` 存储，避免后续重构。
- 修改宠物名字后，历史消息作者名是否回写？建议历史消息保留当时作者名，新消息使用新名字；群名和当前档案显示新名字。
