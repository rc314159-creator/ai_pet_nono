# Demo 实现记录 2026-05-30

## 本轮目标

根据用户对产品形态的纠偏，重构桌宠点击后弹出的电脑程序应用窗口。当前重点是纯展示 mock 视觉，不接真实数据逻辑。

已确认口径：

- 交付形态是电脑程序应用窗口，不是网页展示页。
- 应用窗口比例接近手机屏幕长宽比，当前 demo 使用约 `430x932` 的竖向比例。
- 对话页是类似微信的纯上下文聊天窗口。
- 真实宠物分身在对话页作为背景板展示，不作为侧边栏。
- 今日状态、数据指标和异常报告合并在同一个状态与数据页。
- 桌面端宠物形象由另一个进程/开发线负责，本轮只负责点击桌宠后打开的应用窗口/功能面板端。

## 本轮改动

- `desktop-app/main.cjs`
  - Electron 应用窗口改为手机比例：`430x932`，最小 `390x844`，并设置窗口 aspect ratio。
  - 保留独立 userData 路径和加载日志，避免与桌宠 Electron 进程混淆。

- `vite.config.ts`
  - 设置 `base: "./"`，修复 Electron `loadFile(dist/index.html)` 加载构建产物时资源路径为空白的问题。

- `src/App.tsx`
  - 移除原左右分栏控制台结构。
  - 底部导航调整为：对话、状态、换装、任务。
  - 对话页改为聊天上下文，宠物分身作为低透明背景板。
  - 状态页合并今日状态、异常报告、健康数据和 7 日趋势。
  - 换装页和任务页改为单列手机应用布局。

- `src/styles.css`
  - 重写为手机比例应用窗口样式。
  - 修复聊天消息被输入栏压住的问题。
  - 保证主入口在竖向窗口中无左右分栏和横向溢出。

## 应用窗口视觉迭代

根据用户提供的参考页 `docs/参考/index.html`，应用窗口视觉在不照搬参考页业务结构的前提下做了统一：

- 保持产品形态为桌面程序应用窗口，不把参考 HTML 当作交付入口。
- 四个应用页统一为手机应用框架：顶部圆形操作按钮、居中标题、暖色背景、软卡片、底部导航。
- 对话页继续保持纯聊天上下文，宠物只作为页面中心背景/氛围，不放状态和数据卡片。
- 状态页继续把今日状态、数据指标、异常报告和趋势放在同一页。
- 换装页和任务页对齐同一套顶栏、卡片、按钮和导航视觉语言。

## 参考 App 信息架构修正

根据用户再次纠偏，参考稿不只是视觉参考，还需要对齐初始页和底部一级入口：

- 初始页改为“毛球伙伴”欢迎/介绍页，包含“开始陪伴”按钮。
- 底部导航改为 5 个入口，顺序为：市集、社区、对话、状态、我的。
- “开始陪伴”进入对话页；底部“对话”入口也进入同一长期对话页。
- “我的”承载当前装扮/宠物个人页；原“换装”不再作为底部一级入口。
- 原“任务”不再作为底部一级入口，任务、报告和推荐后续挂入状态/市集/我的等产品链路。

## 验证

- `npm run typecheck` 通过。
- `npm run build` 通过。
- Electron 开发窗口截图：`/tmp/ai-pet-phone-electron-chat-fixed.png`。
- Electron 构建产物窗口截图：`/tmp/ai-pet-built-electron-chat-fixed.png`。
- 渲染层 430x932 验证截图：
  - 对话：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/ai-pet-phone-chat.png`
  - 状态：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/ai-pet-phone-status.png`
  - 换装：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/ai-pet-phone-outfit.png`
  - 任务：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/ai-pet-phone-care.png`
- 参考页对齐后的视觉迭代截图：
  - 对话：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/redesign-v2/chat.png`
  - 状态：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/redesign-v2/status.png`
  - 换装：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/redesign-v2/outfit.png`
  - 任务：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/redesign-v2/care.png`
- 参考 App 信息架构修正后的验证截图：
  - 欢迎页：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/reference-aligned-v3/welcome.png`
  - 市集：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/reference-aligned-v3/market.png`
  - 社区：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/reference-aligned-v3/community.png`
  - 对话：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/reference-aligned-v3/chat.png`
  - 状态：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/reference-aligned-v3/status.png`
  - 我的：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/reference-aligned-v3/my.png`
- Playwright 校验底部导航顺序：`市集`、`社区`、`对话`、`状态`、`我的`。
- 390x844 最小窗口比例检查：无横向溢出，聊天输入栏不遮挡消息。
- Playwright console 检查：0 errors，0 warnings。
- Playwright 非静态网络请求检查：无 failed request。

## 当前限制

- 对话、状态、换装和任务仍使用 mock 数据。
- 桌宠点击打开应用窗口的真实 IPC/入口联动尚未接入本轮重构。
- 应用窗口中的宠物形象仍为程序化 mock avatar，只作为背景板或视觉占位；真实桌宠形象不属于本轮应用窗口端职责。

## 对话页 Agent 群聊实现

本轮根据用户确认，正式把对话页从静态 mock 聊天改为可运行的 Agent 群聊入口。

已确认并写入知识库的口径：

- 对话页主 Agent 使用 OpenAI Agents SDK。
- Demo 固定群聊动物角色为“科技狗”，默认用户角色为“主人”。
- 一个宠物只有一个长期主群聊 thread，当前为 `pet_mochi_main`。
- 主群聊可以扩展为多人参与，但工具结果只作为卡片呈现，不作为群聊人格。
- 文字和语音是不同输出模式；用户要求语音或 UI 选择语音时，当前回合返回语音消息，不是所有文字消息固定后处理。
- 对话页可以通过 Agent 工具触发桌宠动作、电商推荐、memory 写入和语音回复。

本轮代码改动：

- `package.json` / `package-lock.json`
  - 新增 `@openai/agents` 和 `zod`。

- `src/domain/agent.ts`
  - 定义科技狗 persona、单宠物主 thread、群聊消息结构、文字/语音输出模式、memory 类型和本地 fallback。
  - 保留动作意图 fallback，可在无 OpenAI key 时仍触发 `spin` 等动作命令。

- `server/agent.ts`
  - 使用 OpenAI Agents SDK 创建“科技狗” Agent。
  - 暴露 `get_pet_profile`、`get_pet_state`、`get_daily_tasks`、`record_memory`、`recommend_products`、`request_pet_motion`、`reply_with_voice` 工具。
  - 通过 `MemorySession` 维护 `pet_mochi_main` 的进程内主群聊 session。
  - 无 OpenAI key 时回退到本地 persona rule engine，保持 Demo 可运行。

- `server/index.ts`
  - 对话页使用 `/api/agent/chat`。
  - 保留 `/api/agent/status`。
  - Agent 动作工具输出接入现有 motion 仲裁接口。

- `src/App.tsx` / `src/styles.css`
  - 对话页头部改为“科技狗家庭群”。
  - 展示群成员、主 thread、科技狗/主人发言身份。
  - 输入区增加文字/语音模式切换。
  - 语音回复显示为语音消息，可点击播放；无 TTS key 时使用浏览器语音 fallback。
  - 工具调用以卡片呈现，例如“桌宠动作 spin”和“语音回复”。
  - 新消息自动滚动到底部。

验证：

- `npm run typecheck` 通过。
- `npm run build` 通过。
- `/api/agent/status` 在当前环境返回 `local-fallback`，说明当前未配置 OpenAI key。
- `/api/agent/chat` 使用 `responseMode=voice` 和输入“用语音回复我，然后转个圈”返回：
  - `responseMode=voice`
  - `motionCommand.action=spin`
  - 工具卡片包含 `motion` 和 `voice`
  - 当前无 TTS key 时 `voiceProvider=browser-speech-fallback`
- Playwright 验证截图：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/ai-pet-agent-chat-voice.png`
- Playwright console 检查：0 errors。
- Playwright failed request 检查：0 failed requests。

当前限制：

- 当前环境未设置 OpenAI key，因此实际模型路径未在本机跑通；OpenAI Agents SDK 代码路径已实现，配置 `OPENAI_API_KEY` 或 `AI_PET_OPENAI_API_KEY` 后走真实 Agent。
- Memory 目前是进程内 `MemorySession` 和内存数组，后续需要持久化。
- TTS 当前支持 OpenAI Speech API；未设置 key 时前端使用浏览器 `speechSynthesis` 作为 Demo fallback。

## Agent 动作接口与桌宠动作仲裁

根据用户进一步纠偏，修正了“对话页直接动作指令”的错误表述：对话页只和 agent 对话，不能直接解析自然语言并控制桌宠。运动能力现在按接口暴露给 agent，由 agent 判断是否调用动作工具。

本轮补充：

- 新增 `src/domain/motion.ts`
  - 支持手环/设备数据到默认桌宠动作的映射。
  - 支持随机动作命令。
  - 支持 agent 工具调用动作命令。
  - 支持按 `agent_tool_call > random_action > bracelet_mirror` 仲裁当前动作。

- 更新 `src/domain/types.ts`
  - 新增 `PetMotionAction`、`PetMotionSource`、`ExpressionCommand` 和 `MotionArbitrationSnapshot`。

- 更新 `src/domain/agent.ts`
  - 增加 `request_pet_motion` 工具口径。
  - 本地 agent fallback 可在用户说“请转个圈”“跳一下”“随机做个动作”等语境下生成工具调用。
  - agent 回复和动作命令一起返回，但 UI 不直接做自然语言动作解析。

- 新增 `server/motion.ts`
  - 维护服务端动作命令队列。
  - 暴露手环默认动作、随机动作、agent 动作命令的统一仲裁入口。

- 更新 `server/index.ts`
  - 新增 `/api/agent/chat`，agent 回复可携带 `motionCommand`。
  - 新增 `/api/desktop-pet/motion` 和 `/api/desktop-pet/motion/bracelet`，供桌宠运行时或后续联动协议消费。

- 更新 `src/App.tsx`
  - 对话页改为调用 agent chat 接口。
  - 收到 agent 返回的动作命令后，只用动作命令驱动页面内 mock 背景宠物动画；真实桌宠仍需桌宠形象线消费同一动作接口。

验证：

- `npm run typecheck` 通过。
- `npm run build` 通过。
- 本地动作仲裁脚本验证：
  - 只有手环默认映射时 active source 为 `bracelet_mirror`。
  - 加入随机动作后 active source 为 `random_action`。
  - 加入 agent 工具调用后 active source 为 `agent_tool_call`。
- 本地 API 验证：
  - 调用 `/api/agent/chat` 输入“请转个圈给我看看”，返回 `motionCommand.action = spin`、`motionCommand.source = agent_tool_call`，仲裁 active source 为 `agent_tool_call`。
- Browser MCP 当前被另一个 Playwright 实例占用，未完成截图复验；已用 `curl` 验证 Vite 页面可访问，并完成 API 链路验证。

## 桌宠窗口行为与点击弹窗修复

根据用户反馈，当前对话收敛回“桌宠点击到应用窗口”和“应用窗口控制桌宠”的联动实现，不继续扩展 agent 层。

已修复：

- 桌宠窗口从 `520x520` 缩小为 `320x320`。
- 宠物本体从 `460x460` 缩小为 `282x282`，气泡、关闭按钮和动作标签同步按小窗调整。
- 拖动方式从透明背景 CSS drag 改为 renderer 通过 IPC 发送鼠标屏幕坐标，拖动宠物本体即可移动窗口。
- 点击桌宠不再切换动作，而是通过 IPC 打开或聚焦应用窗口。
- 桌宠 runtime 开始轮询 `/api/desktop-pet/motion`，后续应用窗口提交的动作命令可以被桌宠消费；当前动作包只有 `walk`、`jump`、`tail_wag`，其它命令会映射到已有动作。

验证：

- `node --check desktop-photo-pet/main.cjs` 通过。
- `node --check desktop-photo-pet/preload.cjs` 通过。
- `node --check desktop-photo-pet/runtime.js` 通过。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- 已重启 `desktop-photo-pet/main.cjs`，桌面截图确认右下角桌宠已缩小并显示。
