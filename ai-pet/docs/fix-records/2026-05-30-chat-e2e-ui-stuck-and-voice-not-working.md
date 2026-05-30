---
title: 2026-05-30 对话页浏览器端到端卡住与语音不发送问题记录
description: 记录用户在真实应用窗口/浏览器对话页无法正常发送消息、语音回复不工作的反馈、证据、根因排查和修复计划。
status: 已修复
created: 2026-05-30
updated: 2026-05-30
doc_type: fix-record
domain_taxa:
  - e2e
  - agent-runtime
  - voice
  - app-window
related:
  - ../modules/agent-chat-2026-05-30.md
  - 2026-05-30-agent-runtime-open-source-agent-misalignment.md
  - 2026-05-30-agent-chat-provider-qwen-llmmelon-misuse.md
---

# 2026-05-30 对话页浏览器端到端卡住与语音不发送问题记录

## 事实时间线

- 2026-05-30 22:44 CST，用户反馈：当前 `http://127.0.0.1:5181/?view=chat` 对话页无法正常对话，发送消息后一直卡住；请求语音回复时也没有语音。
- 此前只完成过 API/CLI 层验证，未形成浏览器端完整点击、输入、发送、等待、截图、console/network 的 E2E 证据。
- 当前必须按真实浏览器端到端路径重新验证：前端页面、API、OpenCode/opencode runtime、LLM Melon 模型、MCP tools、Qwen TTS、桌宠动作回写。

## 初始证据

- 用户可见页面：`http://127.0.0.1:5181/?view=chat`。
- 已知后端 API status 曾返回 `provider=opencode:llmmelon`、`model=llmmelon/claude-sonnet-4-6`，但这不是浏览器端 E2E 证据。
- 用户反馈表明 UI 层可能存在请求超时、loading 状态不释放、CORS/端口配置、语音模式触发、TTS 失败处理或 OpenCode CLI 延迟未反馈等问题。

## 根因待查

## 根因

- 前端真实请求可到达 8788 API，控制台没有 CORS 或 network error。
- OpenCode/opencode + LLM Melon + MCP 调用在浏览器端真实链路中约需十余秒；原 UI 在等待期间只禁用发送按钮，没有任何可见等待态，用户会看到“像卡住”。
- 语音 bug 的直接原因是：后端只在 `responseMode === "voice"` 时合成语音；用户在文字模式里输入“用语音回复我”时，虽然 `voiceAllowed` 已识别为 true，但 OpenCode 主路径没有用它触发 `synthesizePetSpeech`。
- 输入框默认预置测试句，容易让用户误以为页面卡在旧输入。

## 修复计划

1. 用 in-app Browser 在 `5181/?view=chat` 执行真实发送文本消息，逐步截图并记录 console/network。
2. 复现卡住后定位是前端、CORS、API、OpenCode runtime、LLM Melon 还是 MCP/TTS。
3. 修复能修的问题，并重新执行同一路径。
4. 用真实浏览器发送语音请求，验证是否出现语音消息、audio 数据和播放控件/播放行为。
5. 把最终证据写回本记录，不能只用 API curl 结果替代 E2E 证据。

## 修复结果

- `server/agent.ts`：OpenCode 主路径、OpenAI Agents fallback、本地 fallback 都改为使用 `voiceAllowed` 触发语音合成；文字模式里写“语音/voice”也会返回 voice 消息。
- `src/App.tsx`：发送期间渲染可见 pending 气泡“旺财正在听，马上回你”；输入框默认值清空，空输入时发送按钮禁用；语音播放失败时回退浏览器 speech synthesis。
- `src/styles.css`：补充 pending 气泡和禁用按钮样式。
- `src/domain/agent.ts` 与 `.opencode/prompts/ai-pet-companion.md`：补充不要使用 emoji 的角色输出约束。

## E2E 证据

证据目录：`/tmp/e2e-verify/ai-pet-chat-agent/`

- `01-initial.png`：修复前/初始对话页截图，输入框残留测试句，控制台无错误。
- `02-after-send-1s.png`：修复前发送 1 秒后，发送按钮禁用但没有等待气泡，用户感知为卡住。
- `03-after-send-13s.png`：修复前 13 秒后返回文字和动作卡，但用户要求语音时没有 voice bubble/语音卡。
- `04-reloaded-after-fix.png`：修复后刷新页面，输入框为空，placeholder 为“和旺财说话”，空输入发送按钮禁用，控制台无错误。
- `06-ascii-voice-after-send-1s.png`：修复后发送后 1 秒出现“旺财正在听，马上回你”pending 气泡。
- `07-ascii-voice-final.png`：修复后返回 voice bubble，出现“桌宠动作 / 转个圈”和“语音回复 / 已准备好一条语音”两张工具卡，pending 气泡消失。
- `08-voice-replay-click.png`：点击 voice bubble 可重放，控制台无 error/warn。

说明：in-app Browser 自动化中文输入触发浏览器虚拟剪贴板限制，因此复验输入使用同等语义的 ASCII `voice please spin`；业务链路仍覆盖真实浏览器点击、输入、发送、OpenCode/opencode、LLM Melon、MCP 动作工具、Qwen TTS 和前端 voice bubble。

验证命令：

- `npm run typecheck` 通过。
- `/api/agent/status` 返回 `provider=opencode:llmmelon`、`model=llmmelon/claude-sonnet-4-6`、`tts=qwen-tts`、`ttsConfigured=true`。
