---
title: AI Pet 宠物资料、App 设置与 Persona 配置模块
description: 定义 App 端可编辑宠物资料、主人称呼、角色设定、Prompt 补充和语音偏好的单一真相源、数据流转、持久化、Prompt 合成和端到端验收标准。
status: 已实现
created: 2026-05-31
updated: 2026-05-31
update_reason: 完成 App 端设置编辑、settings store、后端运行时接入、Electron 端到端验证，并同步实现状态。
doc_type: module-spec
domain_taxa:
  - pet-profile
  - app-settings
  - persona
  - prompt-library
  - persistence
  - agent-runtime
related:
  - ../product/product-spec-2026-05-30.md
  - ../architecture/product-logic-framework-2026-05-31.md
  - ../architecture/current-system-architecture-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - agent-chat-2026-05-30.md
  - live-knowledge-base-2026-05-31.md
  - ../fix-records/2026-05-31-profile-and-system-prompt-not-editable.md
---

# AI Pet 宠物资料、App 设置与 Persona 配置模块

## 模块定位

App 端设置不是表面 UI，也不是修复记录里的临时备注。它是产品长期可用性的 P0 配置模块。

用户需要在 App 中编辑宠物名字、主人称呼、宠物资料、角色表达和高级 Prompt 补充。保存后，这些设置必须成为应用窗口、Agent Runtime、MCP tools、桌宠气泡、TTS 和应用内知识库共同读取的单一真相源。

默认配置可以存在，但默认配置不能替代 App 端可编辑配置。

## 2026-05-31 实现状态

已完成当前 Demo 阶段的闭环实现：

- 类型与合并逻辑：`src/domain/settings.ts` 定义 settings override、sanitize、默认 profile 合并和 runtime settings context。
- 持久化：`server/settings.ts` 使用 `AI_PET_SETTINGS_FILE` 或 `.ai-pet-data/settings.json` 保存用户 override，不复制整份默认 profile。
- API：`GET /api/settings`、`PATCH /api/settings`、`PATCH /api/settings/profile`、`PATCH /api/settings/persona`、`PATCH /api/settings/voice`、`POST /api/settings/reset` 已实现。
- App UI：“我的 -> 资料设置”已支持显示名、真实名、主人称呼、群聊名、品种、月龄、体重、性格补充、说话风格、系统提示词补充、回复长度、主动程度、禁用表达和声音补充。
- 前端运行时：`App.tsx` 启动时读取 merged settings，保存后刷新我的页、对话页群名、输入 placeholder、Agent context 和新消息作者。
- 后端运行时：`petRuntimeSnapshot`、`petEventRuntime`、`agent`、`opencodeAgent`、`voice`、`knowledgeBase`、`MCP tools`、`desktop-pet/status`、`desktop-pet/say`、`desktop-pet/bubble`、`agent/chat` 均改为读取 active merged settings。
- 打包链路：`desktop/photo-pet/main.cjs` 在 packaged runtime 设置 `AI_PET_SETTINGS_FILE`；`vite.config.ts` 的 dev proxy 支持 `VITE_AI_PET_API_BASE_URL`，避免非默认 API 端口验证时前端误连 8788。

已验证：

- `npm run typecheck` 通过。
- `npm run build` 通过，包含 Vite renderer build 和 `build/server/index.cjs`。
- API 验证：保存后 `GET /api/settings`、`/api/health`、`/api/desktop-pet/status`、`/api/desktop-pet/bubble`、`/api/agent/chat` 和知识库身份档案均返回新设置。
- Browser renderer E2E：进入“我的 -> 资料设置”，保存“小青 / 家长 / 小青家庭群”，对话页新回复使用“小青在呀，家长”，console 和 network 无新错误。
- Electron 桌宠链路：通过 `desktop/photo-pet` 从桌宠打开应用窗口，保存“小蓝 / 饲养员 / 小蓝家庭群”，切到对话页后群名、placeholder、新消息作者和 Agent 自称均使用新设置。

当前策略：历史消息保留当时写入的 `authorName`；保存后的新消息、主动事件、MCP profile、知识库身份档案和桌宠气泡使用最新 settings。

## 当前问题

当前代码中宠物身份和 persona 仍有多个静态来源：

- `src/domain/mockData.ts` 的 `petProfiles[0]` 写死当前宠物默认资料。
- `src/app/App.tsx` 直接读取 `petProfiles[0]` 并把它传给对话页、状态页、我的页和 Agent context。
- `server/petRuntimeSnapshot.ts`、`server/petEventRuntime.ts`、`server/knowledgeBase.ts` 也直接或间接读取 `petProfiles[0]`。
- `src/domain/agent.ts` 的默认 `techDogPersona` 和 `.opencode/prompts/ai-pet-companion.md` 共同形成默认 Dog Persona，但没有用户 override。
- `server/threadStore.ts` 保存消息和 memory，不保存 profile/persona/settings。

如果只新增前端输入框，会造成我的页、对话页、主动提醒、MCP 档案、知识库和 TTS 不一致。

## 单一真相源

应新增独立的 settings/profile store：

```text
Default PetProfile + Default Persona + User Settings Overrides
  -> Merged Pet Settings
  -> App UI
  -> Agent Runtime
  -> MCP Tools
  -> Pet Event Runtime
  -> TTS
  -> Knowledge Base
  -> Desktop Bubble through ThreadMessage
```

Demo 阶段持久化：

- 默认文件：`.ai-pet-data/settings.json`。
- 测试可通过环境变量指向独立文件，例如 `AI_PET_SETTINGS_FILE`。
- 文件只保存 override，不复制整份默认 profile/persona。

生产阶段方向：

- 迁移到 SQLite、PostgreSQL 或正式应用数据库。
- API 契约和 merged settings 逻辑不应退回前端 state。

## 设置分类

### 宠物身份设置

最小字段：

- `petId`
- `displayName`
- `realName`
- `species`
- `breed`
- `ageMonths`
- `weightKg`
- `profileImageUrl`
- `ownerDisplayName`
- `groupNameOverride`

约束：

- `petId` 决定主 thread，修改显示名不应创建新 thread。
- 历史消息保留当时 `authorName`，新消息使用新显示名。
- 主人称呼影响新用户消息作者名和 Agent prompt context。

### Persona 设置

最小字段：

- `personalitySummary`
- `speechStyleSupplement`
- `exampleDialogues`
- `forbiddenPhrases`
- `proactiveLevel`
- `responseLength`

约束：

- 用户设置是 persona override，不直接替换系统 prompt。
- 默认 Dog Persona 的工具规则、动作规则、记忆规则、工程词禁令和健康边界必须保留。
- 用户可以影响语气和角色设定，但不能破坏 `request_pet_motion`、`record_memory`、`reply_with_voice` 等工具契约。

### 语音设置

最小字段：

- `voiceProvider`
- `voiceId`
- `voicePromptSupplement`
- `ttsSpeed`
- `ttsPitch`

约束：

- 语音角色必须和文字 persona 一致。
- 如果 TTS provider 不可用，浏览器语音 fallback 也应读取当前 displayName/ownerDisplayName。

### 高级 Prompt 设置

App 端可以提供“高级角色设定”或“Prompt 补充”，但不应允许用户完整覆盖底层系统 Prompt。

正确合成方式：

```text
Non-editable system boundary
+ Default Dog Persona role card
+ Current merged PetProfile
+ User persona overrides
+ Recent history
+ Memory
+ Tool rules
```

不可编辑的底层边界包括：

- 不暴露 Agent、模型、工具、MCP、JSON、系统提示词等工程词。
- 动作请求必须走动作工具。
- 用户要求记住时必须写 memory。
- 语音只在明确请求或 UI 模式选择时触发。
- 健康内容只做观察和风险边界，不做诊断或处方。

## App 信息架构

入口位置：

```text
我的
├─ 宠物资料 / 对话设置
│  ├─ 基础资料
│  ├─ 对话设定
│  ├─ 语音设定
│  └─ 高级角色设定
├─ 宠物知识库
├─ 用户激励
└─ 我的装扮区
```

设计原则：

- 入口放在“我的”页，不塞进对话页。
- 基础用户优先看到可理解字段：名字、头像、主人称呼、性格、语气。
- 高级 Prompt 补充必须折叠，带恢复默认和预览合成结果。
- 保存后给明确反馈，但不能把内部 prompt 或工具细节暴露成普通用户文案。

## 数据流

### 保存设置

1. 用户在应用窗口编辑设置。
2. 前端调用 settings API。
3. 后端校验字段，写入 settings store。
4. 后端返回 merged settings。
5. 前端更新当前 profile/persona state。
6. 知识库写入“资料已更新”事件，并刷新身份档案条目。

### 对话消息

1. 对话页读取 merged profile/persona。
2. 用户消息使用当前 `ownerDisplayName`。
3. `/api/agent/chat` 使用 merged settings 构造 runtime snapshot。
4. OpenCode/opencode prompt adapter 使用 merged profile/persona 和用户 overrides。
5. 宠物回复写入 thread store，新消息 `authorName` 使用当前宠物显示名。
6. 桌宠气泡显示同一条 `ThreadMessage.text`，不另起一套名字或文案。

### 主动事件

1. Cron/Hook 触发 `PetEventRuntime`。
2. Runtime 每次事件处理时动态读取 merged settings，不允许模块加载时缓存 `petProfiles[0]`。
3. 生成 Dog Persona 消息并写入同一主 thread。
4. 桌宠和对话页复用同一条 `ThreadMessage`。

### MCP Tools

MCP `get_pet_profile`、状态读取和后续设置工具必须读取 active merged profile。

禁止 MCP 返回静态 mock profile，同时 App UI 显示用户修改后的 profile。

## API 契约

最小 API：

- `GET /api/settings`：返回 default、overrides 和 merged settings。
- `PATCH /api/settings/profile`：保存宠物身份和主人称呼。
- `PATCH /api/settings/persona`：保存角色表达、语气和高级 Prompt 补充。
- `PATCH /api/settings/voice`：保存语音设置。
- `POST /api/settings/reset`：按 section 恢复默认。

后续可加：

- `GET /api/settings/prompt-preview`：返回脱敏后的合成 prompt 预览。
- `POST /api/settings/test-reply`：用当前设置生成一条测试回复，但不写入主 thread。

## 与 Memory 的边界

Settings 和 Memory 不是同一层：

- Settings：用户主动配置的当前产品真相，例如宠物显示名、主人称呼、角色设定、语气偏好。
- Memory：对话过程中积累的关系事实、偏好、承诺和事件摘要。

用户在设置页改名字，应写 settings。

用户在聊天里说“记住我晚上 8 点喂你”，应写 memory。

如果用户在聊天里明确说“以后你叫小白”，Agent 可以引导用户打开设置页，或后续通过受控 `update_pet_profile` 工具写 settings；不能只把名字写入 memory 后让 UI、MCP 和桌宠继续使用旧名。

## 验收标准

完成开发后必须验证：

- 修改宠物显示名后，App 我的页、对话群名、输入 placeholder、新宠物消息作者、桌宠气泡对应消息、MCP `get_pet_profile`、知识库身份档案一致。
- 修改主人称呼后，新用户消息作者和 Agent 回复称呼一致。
- 修改 persona override 后，下一轮 Agent 回复体现新风格，但动作请求仍调用 motion tool。
- 修改语音设置后，语音回复使用当前 persona/TTS 设置；失败 fallback 也不回旧名。
- 触发 `POST /api/agent/cron/tick` 和 `POST /api/agent/hooks` 后，主动消息使用当前设置。
- 重启完整 Electron App 后设置仍存在。
- 验收必须走 `npm run dev` 或交付态 `.app` 的完整桌宠链路，浏览器 `127.0.0.1:5180` 只能作为 renderer smoke test。

## 开发顺序

强制顺序：

1. 更新知识库和模块契约。
2. 实现 settings store、merged settings 纯函数和 API。
3. 替换后端 runtime、MCP、知识库和主动事件的静态 profile 读取点。
4. 替换前端 App 的静态 `petProfiles[0]` 读取点。
5. 实现“我的 -> 宠物资料/对话设置”UI。
6. 执行接口、单元和 Electron 端到端验证。
