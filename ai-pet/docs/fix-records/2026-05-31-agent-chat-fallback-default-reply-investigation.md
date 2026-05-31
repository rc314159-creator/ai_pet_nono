---
title: 对话页未返回 Agent 回复而显示默认兜底话术问题记录
description: 记录用户发送“现在几点了”后，对话页显示本地默认兜底回复，而不是 OpenCode/opencode Agent 按用户问题生成回复的原因定位。
status: 已修复并验证
created: 2026-05-31
updated: 2026-05-31
doc_type: fix-record
domain_taxa:
  - agent-runtime
  - chat
  - fallback
  - opencode
related:
  - ../modules/agent-chat-2026-05-30.md
  - ../architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md
  - ../architecture/current-system-architecture-2026-05-30.md
---

# 对话页未返回 Agent 回复而显示默认兜底话术问题记录

## 事实时间线

- 2026-05-31 用户在对话页发送：“现在几点了”。
- 对话页右侧出现主人消息后，左侧宠物回复为：“汪，主人我在这儿。早上我吃了 138g，肚皮今天有点痒，晚上你帮我看看，再陪我慢慢散一会儿好不好？”
- 用户指出这段话像默认发的，不像 Agent 根据“现在几点了”生成的回复，并要求先调查原因。
- 第一轮修复后只做了源码/接口/打包产物验证，没有替换并启动 `/Applications/AI Pet Demo.app` 做完整 E2E。用户再次指出“现在还是这样”，事实证明当时仍在运行旧安装包，交付判断不成立。

## 当前证据

- 模块契约要求：对话页主 Agent runtime 是 OpenCode/opencode + `ai_pet` MCP tools，本地 persona rule engine 只能作为 fallback。
- 截图文本与 `src/domain/agent.ts` 的 `composeLocalPetReply()` 默认分支高度相似，该默认分支会在无法命中特定意图或主 Agent 不可用时返回健康/喂食/肚皮摘要。
- 当前占用 `127.0.0.1:8788` 的进程是 `/Applications/AI Pet Demo.app/Contents/MacOS/AI Pet Demo`，不是源码目录里的 `npm run dev`。
- 打包应用进程的 cwd 是 `/`，环境 PATH 是 macOS GUI 默认的 `/usr/bin:/bin:/usr/sbin:/sbin`。
- `/Applications/AI Pet Demo.app/Contents/Resources/.env` 已声明 `AI_PET_AGENT_RUNTIME=opencode`、`AI_PET_OPENCODE_PROVIDER=llmmelon` 和 `AI_PET_OPENCODE_MODEL=claude-sonnet-4-6`，但 `server/opencodeAgent.ts` 用 `process.cwd()` 作为项目根目录并检查 `opencode.json`，在打包进程 cwd 为 `/` 时会检查 `/opencode.json`，因此 OpenCode runtime 被判定为不可用。
- 打包包体 `app.asar` 内包含 `/opencode.json` 和 `/.opencode/prompts/ai-pet-companion.md`，但当前运行时没有把 opencode 项目根指向 asar 内资源或解包资源。
- 即使修正项目根，打包应用从 Finder/GUI 启动时 PATH 默认不包含 `/opt/homebrew/bin`，当前本机 `opencode` CLI 位于 `/opt/homebrew/bin/opencode`，直接 `spawnSync("opencode")` 也可能找不到 CLI。
- `/api/agent/status` 当前显示 `provider: openai-agents-sdk:llmmelon` 且 `configured: true`，说明 OpenCode 被跳过后落到了 OpenAI Agents SDK 兼容网关路径。
- thread store 中该用户消息和宠物回复具有同一个 `clientTurnId=turn-d80ab425-7c8e-44f8-b403-dd7c4efddc02`，宠物回复 provider 是 `local-fallback`，不是 `opencode`、`llmmelon-pet-event` 或 `openai-agents-sdk`。
- 用户消息创建于 `2026-05-31T04:46:39.418Z`，宠物 fallback 回复创建于 `2026-05-31T04:46:51.437Z`，间隔约 12.0 秒，刚好对应 `server/agent.ts` 中 `AI_PET_AGENT_TIMEOUT_MS || 12000` 的默认 Agent 运行超时。
- 同一时间附近的 `pet-event-1780202873830-be871d` 是 proactive 事件，provider 为 `local-dog-persona-fallback`，与用户 turn 不同，没有相同 `clientTurnId`，不是截图里这条用户消息的直接回复。

## 根因结论

本轮不是前端显示错消息，也不是 Agent 按“现在几点了”生成了错误内容；后端这次没有成功拿到主 Agent 回复。

链路为：打包应用启动后，OpenCode runtime 因项目根和 CLI PATH 问题被判定不可用 -> 后端降级到 `openai-agents-sdk:llmmelon` 网关路径 -> 该路径在 12 秒默认超时时间内没有返回最终输出或请求失败 -> `createPetAgentReply()` catch 后调用 `fallback("openai_agents_request_error", ...)` -> `composeLocalPetReply()` 对“现在几点了”没有时间意图分支，落入默认健康/喂食/肚皮摘要 -> message 入库为 `provider: local-fallback`。

所以用户看到的这句“汪，主人我在这儿。早上我吃了 138g...”确实是本地兜底默认话术，不是 Agent 回复。

补充复现：

- 源码级强制走 `openai-agents` fallback 时，曾复现到 llmmelon 网关返回 `403 user quota is not enough`；后续同一路径也能成功返回，说明该 fallback 路径受外部模型网关账号/额度状态影响，不应作为稳定主路径。
- 裸 `opencode run` 不加载 `.env.local` 时返回 `401 Invalid token`；加载 `.env.local` 后简单 `pong` 请求可成功返回，说明 OpenCode CLI 本身可用，关键是打包应用必须显式加载正确资源根、PATH 和环境。
- 修复前 OpenCode 子进程默认等待 75 秒，但前端 18 秒就 abort，会让用户看到客户端 fallback 或长时间等待；修复后默认 OpenCode 超时缩短到前端 abort 之前，并解析 opencode error event。
- 第一轮真实新包 E2E 暴露了三个额外问题：Resources 下的 `opencode.json` 仍用 `npm run mcp:ai-pet`，打包目录无法启动 MCP；opencode 在打包环境中没有稳定加载自定义 `ai-pet-companion` agent，需要显式传 `--dir <Resources>`；llmmelon 的 Claude 配额不可用，需要切到实测可用的 `deepseek-chat` 模型。

## 修复内容

- `src/domain/agent.ts`：本地 fallback 增加“现在几点/当前时间”确定性回答；默认 fallback 改为温和陪伴话术，不再输出 `138g/肚皮/散步` 等无关照护摘要。
- `server/opencodeAgent.ts`：支持 `AI_PET_OPENCODE_PROJECT_ROOT`、`process.resourcesPath`、Homebrew CLI 路径和 `AI_PET_OPENCODE_BIN`；默认 OpenCode timeout 缩短到 15 秒；解析 `opencode` error event 并拒绝空输出。
- `server/opencodeAgent.ts`：启动 `opencode run` 时显式传 `--dir <projectRoot>`，避免打包应用误读全局默认 agent；支持 `aihubmix`、`yunwu` 和通用 provider key 探测；最终安装包当前使用 `llmmelon/deepseek-chat`。
- `server/agent.ts`：状态接口暴露 OpenCode projectRoot/cliPath；`AI_PET_AGENT_RUNTIME=opencode` 且 OpenCode 不可用时，不再静默切到 SDK fallback，而是快速返回 `opencode_runtime_not_configured`。
- `desktop/photo-pet/main.cjs`：打包运行时补充 `/opt/homebrew/bin`、`/usr/local/bin`，并在 Resources 下存在 `opencode.json` 时设置 `AI_PET_OPENCODE_PROJECT_ROOT`。
- `package.json`：把 `opencode.json`、`.opencode/prompts/**`、`scripts/run-mcp.cjs` 和 `build/server/mcp.cjs` 作为 `extraResources` 放入打包 Resources，供外部 `opencode` CLI 读取和启动 MCP。
- `scripts/run-mcp.cjs`：新增 MCP runner，源码环境走本地 `tsx server/mcp.ts`，打包环境走外部 `build/server/mcp.cjs`。
- `server/mcp.ts`：去掉 top-level await，允许 esbuild 打成 CommonJS MCP bundle。
- `.opencode/prompts/ai-pet-companion.md`、`server/agent.ts`、`server/opencodeAgent.ts`：给 Agent prompt 注入当前运行时间，用户问时间时主 Agent 也能直接回答。
- `.opencode/prompts/ai-pet-companion.md`、`server/agent.ts`、`server/opencodeAgent.ts`：进一步约束时间问题只回答时间和一句轻陪伴，不附带健康、肚皮、进食、散步、任务或库存信息。

## 验证结果

- 本地 fallback 输入“现在几点了”返回“现在是 HH:mm...”且不包含 `138g/肚皮/散一会/早上我吃`。
- 本地 fallback 输入泛化聊天句子，返回温和陪伴话术且不插入无关照护摘要。
- 模拟打包 cwd 为 `/`、PATH 为 `/usr/bin:/bin` 且设置 `AI_PET_OPENCODE_PROJECT_ROOT=<repo>/ai-pet`，状态返回 `provider=opencode:llmmelon`、`configured=true`。
- 模拟显式 `AI_PET_AGENT_RUNTIME=opencode` 但项目根无效，约 0.5 秒返回 `provider=local-fallback`、`warning=opencode_runtime_not_configured`。
- 真实 OpenCode 路径输入“现在几点了”，返回 `provider=opencode:llmmelon`，回答“现在是下午一点零六分...”。
- `node --check`、`npm run typecheck`、`npm run build`、`git diff --check` 均通过。
- `npm run dist:mac:demo` 通过；新打包产物的 `Contents/Resources` 已包含 `opencode.json`、`.opencode/prompts/ai-pet-companion.md` 和 `AI_PET_AGENT_RUNTIME=opencode` 的 `.env`。
- 真实新包首次 E2E 失败记录：启动 `ai-pet/release/mac-arm64/AI Pet Demo.app` 后状态为 `opencode:llmmelon`，但聊天返回 `local-fallback` + `opencode_exit_1`；修复 MCP runner 后又暴露 `Agent not found: "ai-pet-companion"`；加 `--dir` 后进入主 Agent；切到 `llmmelon/deepseek-chat` 后模型调用稳定。
- 真实安装版最终 E2E：替换 `/Applications/AI Pet Demo.app` 后启动，`GET /api/agent/status` 返回 `provider=opencode:llmmelon`、`model=llmmelon/deepseek-chat`、`projectRoot=/Applications/AI Pet Demo.app/Contents/Resources`。
- 真实安装版最终 E2E：通过实际运行中的 `/api/agent/chat` 发送“现在几点了”，返回 `provider=opencode:llmmelon`、`message.provider=opencode:llmmelon`，回复“现在是 13:33。汪，我在这儿呢，耳朵竖起来听你说话。”，不包含 `138g/肚皮/散步/任务/库存`。
- 最后一次重打包并覆盖 `/Applications` 后复验：`/api/agent/chat` 返回 `provider=opencode:llmmelon`、`model=llmmelon/deepseek-chat`，回复“现在是 13:36 啦。汪，我还趴在垫子上呢，耳朵一直竖着听你说话。”，不包含旧默认照护摘要。
- 真实 UI E2E：在安装版窗口中输入并发送“现在几点了”，聊天流显示新主人消息和宠物回复“现在是 13:30...”，后端同一 turn 入库 provider 为 `opencode:llmmelon`。
- 桌宠气泡 E2E：触发带 bubbleText 的 motion command 后，截图 `/tmp/e2e-verify/ai-pet-agent-runtime-20260531/02-installed-desktop-bubble.png` 显示气泡位于宠物上方/侧上方，没有覆盖宠物本体。

## 待查问题

1. 后续如果继续保留 OpenAI Agents SDK fallback，需要单独评估 llmmelon 兼容层额度、稳定性和超时参数；当前不把它作为主路径。
2. 新打包产物已生成在 `ai-pet/release/mac-arm64/AI Pet Demo.app` 和 `ai-pet/release/AI Pet Demo-0.1.0-mac-arm64.zip`；`/Applications/AI Pet Demo.app` 已替换为新包。

## 调查计划

1. 读取当前 thread store 中最近消息，确认该宠物回复的 `provider`、`id`、`clientTurnId` 和创建时间。
2. 检查 `/api/agent/chat` 后端代码的 provider 选择路径和 fallback 条件。
3. 检查当前运行进程和端口，排除旧 packaged app 或旧 dev server 接管 API。已完成。
4. 汇总根因后再决定修复方案。已完成。
