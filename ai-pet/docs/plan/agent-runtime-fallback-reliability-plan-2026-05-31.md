---
title: Agent Runtime 与本地 fallback 可靠性修复计划
description: 修复“现在几点了”未走 Agent 且显示不自然默认兜底文案的问题，并验证打包应用 OpenCode runtime 资源根、CLI 发现和 fallback 诊断。
status: 已批准
created: 2026-05-31
updated: 2026-05-31
execution_status: 已完成
current_step: 4
doc_type: development-plan
domain_taxa:
  - agent-runtime
  - chat
  - fallback
  - packaging
related:
  - ../modules/agent-chat-2026-05-30.md
  - ../architecture/agent-runtime-dog-persona-and-bubble-lifecycle-2026-05-31.md
  - ../fix-records/2026-05-31-agent-chat-fallback-default-reply-investigation.md
---

# Agent Runtime 与本地 fallback 可靠性修复计划

## 问题

用户发送“现在几点了”后，聊天页显示本地默认照护摘要：“早上我吃了 138g...”。这不是自然宠物对话，也不应该作为默认 fallback 策略。

同时当前打包应用没有成功进入 OpenCode 主 Agent runtime：Electron 打包进程 cwd 为 `/`，OpenCode 配置只在 asar 内或源码目录中，GUI PATH 也找不到 `/opt/homebrew/bin/opencode`，因此后端跳过 OpenCode 后进入 OpenAI Agents SDK fallback。源码级复现曾观察到 SDK fallback 返回 `403 user quota is not enough`，后续同一路径也可成功返回，说明该 fallback 路径受模型网关账号/额度状态影响，不应作为主 Agent 稳定路径。

## 修复方案

1. 本地 fallback 默认文案改为“温和接住”策略，不再输出进食、抓挠、任务等不相关照护摘要。
2. 对“现在几点了/当前时间”等确定性问题，在本地 fallback 中直接用本机时间回答，避免答非所问。
3. 打包运行时设置 OpenCode 项目根：如果 `process.resourcesPath/opencode.json` 存在，设置 `AI_PET_OPENCODE_PROJECT_ROOT=process.resourcesPath`。
4. 打包运行时补充 `/opt/homebrew/bin` 和 `/usr/local/bin` 到 PATH，并支持 `AI_PET_OPENCODE_BIN` 显式指定 CLI。
5. 打包产物把 `opencode.json` 和 `.opencode/prompts/**` 作为 `extraResources` 放到 Resources，确保外部 `opencode` CLI 可以读取。
6. 当 `AI_PET_AGENT_RUNTIME=opencode` 但 OpenCode 不可用时，后端直接返回带 `opencode_runtime_not_configured` warning 的本地 fallback，不再静默切到 SDK fallback。
7. OpenCode 默认超时必须短于前端 18 秒 abort；opencode error event 必须被解析成 `opencode_api_error`，避免 401/403/额度错误表现为空回复或长时间挂起。
8. Agent prompt 必须显式提供当前运行时间；用户问“现在几点了”时，主 Agent 和本地 fallback 都应回答问题本身。
9. 打包环境必须提供可运行的 MCP runner，不能继续使用源码期 `npm run mcp:ai-pet`。
10. 端到端验证必须启动最终安装路径 `/Applications/AI Pet Demo.app`，检查运行进程、状态接口、真实 chat turn、UI 截图和桌宠气泡；只验证源码或 release 目录不算交付。

## 验证

1. `createLocalAgentTurn("现在几点了")` 应返回当前时间相关文案，不出现“138g/肚皮/散步”默认摘要。
2. `createLocalAgentTurn("随便聊一句")` 应返回温和陪伴文案，不出现无关照护数据。
3. 在 `process.chdir("/")`、`PATH=/usr/bin:/bin`、`AI_PET_OPENCODE_PROJECT_ROOT=<repo>/ai-pet` 条件下，`getAgentRuntimeStatus()` 应识别 OpenCode 可用，证明打包 cwd 不再影响项目根。
4. 在 `AI_PET_AGENT_RUNTIME=opencode` 且项目根无效条件下，`createPetAgentReply()` 应快速返回 `provider=local-fallback` 与 `warning=opencode_runtime_not_configured`，不等待 SDK fallback。
5. 运行 `node --check` 覆盖 Electron CJS 文件，运行 `npm run typecheck` 和 `npm run build`。
6. 若时间允许，检查 electron-builder 配置中 `extraResources` 是否包含 OpenCode 配置与 Prompt。

## 进度

- [x] 更新架构与模块知识库。
- [x] 修改 fallback 文案和 runtime 探测。
- [x] 完成接口级与构建验证。
- [x] 回填修复记录。

## 验证结果

- `createLocalAgentTurn("现在几点了")` 返回“现在是 HH:mm...”时间回答，不再包含 `138g/肚皮/散一会`。
- `createLocalAgentTurn("我刚才那句话你怎么看")` 返回温和陪伴话术，不再插入无关照护摘要。
- 模拟 `process.chdir("/")`、`PATH=/usr/bin:/bin`、`AI_PET_OPENCODE_PROJECT_ROOT=<repo>/ai-pet` 后，`getAgentRuntimeStatus()` 返回 `provider=opencode:llmmelon`、`configured=true`、`projectRoot=<repo>/ai-pet`。
- 模拟 `AI_PET_AGENT_RUNTIME=opencode` 且项目根无效后，`createPetAgentReply()` 约 0.5 秒返回 `provider=local-fallback`、`warning=opencode_runtime_not_configured`。
- 真实 OpenCode 路径输入“现在几点了”返回 `provider=opencode:llmmelon`，回答“现在是下午一点零六分...”。
- `node --check desktop/photo-pet/main.cjs && node --check desktop/photo-pet/preload.cjs && node --check desktop/photo-pet/bubble-preload.cjs` 通过。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- `npm run dist:mac:demo` 通过；新产物 `release/mac-arm64/AI Pet Demo.app/Contents/Resources/` 中已存在 `opencode.json`、`.opencode/prompts/ai-pet-companion.md` 和声明 `AI_PET_AGENT_RUNTIME=opencode` 的 `.env`。
- 第一轮 release app E2E 失败并修复：`/api/agent/chat` 曾返回 `local-fallback` + `opencode_exit_1`，根因为 MCP 启动命令仍依赖源码 npm script；已新增 `scripts/run-mcp.cjs` 和 `build/server/mcp.cjs` extraResource。
- 第二轮 release app E2E 失败并修复：`/api/agent/chat` 曾返回 `opencode_api_error:Agent not found`，已在 `opencode run` 参数中显式传 `--dir <projectRoot>`。
- 第三轮 release app E2E 失败并修复：`opencode` 已返回主 Agent，但时间问题仍附带肚皮/照护信息；已加强时间问题 prompt 禁止附加健康、肚皮、进食、散步、任务和库存状态。
- 最终安装版 `/Applications/AI Pet Demo.app` E2E 通过：`GET /api/agent/status` 返回 `provider=opencode:llmmelon`、`model=llmmelon/deepseek-chat`、`projectRoot=/Applications/AI Pet Demo.app/Contents/Resources`。
- 最终安装版 `/api/agent/chat` E2E 通过：发送“现在几点了”返回 `provider=opencode:llmmelon`，答案为“现在是 13:33。汪，我在这儿呢，耳朵竖起来听你说话。”，不含旧默认照护摘要。
- 最终重打包覆盖 `/Applications` 后再次复验通过：发送“现在几点了”返回 `provider=opencode:llmmelon`、`model=llmmelon/deepseek-chat`，答案为“现在是 13:36 啦。汪，我还趴在垫子上呢，耳朵一直竖着听你说话。”，不含旧默认照护摘要。
- 最终 UI E2E 通过：安装版窗口内实际输入并发送“现在几点了”，聊天流显示 opencode 生成的新时间回答；截图检查桌宠气泡不覆盖宠物本体，截图路径 `/tmp/e2e-verify/ai-pet-agent-runtime-20260531/02-installed-desktop-bubble.png`。
- `git diff --check` 通过。
