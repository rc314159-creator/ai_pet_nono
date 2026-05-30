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

## 应用窗口交互 Mock 修正

根据用户反馈，当前展示页不能只是静态 mock，基础按钮和入口都需要有可见反馈。本轮把应用窗口补成可点击原型：

- 市集页：`全部`、`主粮`、`护理`、`玩具`、`保健` 分类可切换；推荐区从“状态触发”改为面向宠物档案、库存、抓挠记录和今日任务的推荐页；商品卡片带 mock 图片并可打开详情。
- 社区页：搜索框可以按标题、作者、正文和标签过滤帖子；每个帖子可点击进入详情。
- 状态页：日期条可切换不同日报数据；健康报告按钮可打开 fake health report；异常历史可展开 mock 历史列表。
- 我的页：`服装`、`毛发`、`妆容`、`配饰` 均可切换，条目可选中并可保存 mock 装扮结果。
- 对话页的 Agent 群聊、语音/文字模式和工具卡片保留，不在这次视觉交互修复里降级。

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
- 交互 mock 修正后的验证截图：
  - 欢迎页：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/interactive-mock-v4/welcome.png`
  - 市集护理分类与商品详情：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/interactive-mock-v4/market-care-detail.png`
  - 社区搜索与帖子详情：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/interactive-mock-v4/community-search-detail.png`
  - 状态日期切换与健康报告：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/interactive-mock-v4/status-report.png`
  - 我的页配饰保存：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/interactive-mock-v4/my-accessory-saved.png`
- Playwright 校验底部导航顺序：`市集`、`社区`、`对话`、`状态`、`我的`。
- Playwright 校验交互路径：市集分类和商品详情、社区搜索和帖子详情、状态日期和健康报告、我的页装扮分类和保存。
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

更新：

- 用户确认 Agent 后台 API 使用 llmmelon；已新增 `server/agentGateway.ts`，OpenAI Agents SDK 通过 `OpenAIProvider({ baseURL: https://llmmelon.cloud/v1, useResponses: false })` 走 OpenAI-compatible Chat Completions。
- 用户确认语音使用阿里云百炼 Qwen；已新增 `server/voice.ts`，优先使用 `qwen-voice-design` 创建/复用科技狗自定义音色，再调用 `qwen3-tts-vd-2026-01-26` 合成语音。
- 新增 `.env.example` 和 `server/env.ts`，支持 `.env.local` 本地配置 key，但真实 key 不写入仓库。
- `/api/agent/status` 现在返回 Agent provider/model 与 TTS provider/model/voice 状态。

验证补充：

- llmmelon `/v1/models` key 校验通过，返回 306 个模型；当前选择 `gpt-4o-mini` 作为 Demo Agent 模型。
- 直接调用 `createPetAgentReply` 的 OpenAI Agents SDK + llmmelon 路径通过，`record_memory` 工具可被模型调用。
- Qwen TTS 实测通过，`qwen-voice-design` 已生成科技狗 Demo 音色，`qwen3-tts-vd-2026-01-26` 返回 `audio/x-wav` 音频。
- 开发 API `/api/agent/chat` 实测通过：provider=`openai-agents-sdk:llmmelon`，voiceProvider=`qwen-tts`，返回音频，工具卡片包含 `motion` 和 `voice`，动作命令为 `spin`。
- Playwright 应用窗口截图：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/ai-pet-agent-chat-llmmelon-qwen.png`，console errors=0，failed requests=0。

当前限制：

- Memory 目前是进程内 `MemorySession` 和内存数组，后续需要持久化。
- 缺少 llmmelon key 时 Agent 仍回退本地 persona；缺少 Qwen key 或 Qwen 供应商失败时前端使用浏览器 `speechSynthesis` 作为 Demo fallback。

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

## “我的”页头像与昵称更新

根据用户提供的参考图，本轮将应用窗口“我的”页顶部宠物档案卡从程序化 CSS 小狗头像替换为更接近 3D 柯基近景的图片头像，并把该卡片显示名改为“旺财”。

实现：

- 使用 llmmelon `gpt-image-2` 生成方形柯基头像资产：`public/assets/pets/mochi/wangcai-profile-avatar-v1.png`。
- `src/domain/types.ts` 为 `PetProfile.avatar` 增加可选 `profileImageUrl` 字段。
- `src/domain/mockData.ts` 为 Mochi 档案配置 `profileImageUrl`，使用相对资源路径兼容 dev server 与 Electron `file://dist`。
- `src/App.tsx` 的“我的装扮”页顶部 profile strip 优先渲染图片头像，当前页面显示名固定为“旺财”。
- `src/styles.css` 调整圆形头像裁切、品种年龄单行显示和中文同步说明间距。

验证：

- `npm run typecheck` 通过。
- `npm run build` 通过。
- Browser 实测路径：进入应用窗口 -> 开始陪伴 -> 底部“我的”，确认头像显示为生成柯基图、标题为“旺财”、品种年龄不换行。
- 验证截图：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/wangcai-my-profile.png`。
- 用户纠正最终目标是 Electron 应用窗口后，已重启 `AI_PET_LOAD_DIST=1 npm run dev:app` 并在 Electron `file://dist/index.html` 中复验通过。
- Electron 窗口验证截图：`/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/electron-wangcai-my-profile.png`。

## Electron 应用窗口宠物形象与桌宠显隐联动修复

根据用户提供的三张应用窗口截图和第四张桌宠截图，本轮把应用窗口中的宠物形象与照片级桌宠动作包统一，并修复应用窗口打开/关闭时桌宠显隐逻辑。

已修复：

- 新增 `src/components/MochiMotionAvatar.tsx`，在 React 应用窗口内读取 `public/assets/pets/mochi/motions/manifest.json`，按动作帧播放照片级 Mochi 透明 PNG 序列。
- `src/App.tsx` 的 `PetFigure` 不再渲染 CSS 程序化柯基，统一委托 `MochiMotionAvatar`。
- 对话页顶部背景宠物、状态页状态卡宠物、我的装扮页大预览宠物均改为第四张桌宠同源的照片级动态形象。
- `desktop-photo-pet/main.cjs` 在创建/聚焦应用窗口时隐藏桌宠窗口，在应用窗口关闭时恢复桌宠窗口并保持置顶。
- `package.json` 默认 `npm run dev` 改为启动 `api + renderer + photo-pet` 集成 Electron 链路；原 OpenPets + standalone 应用窗口组合保留为 `npm run dev:openpets-app`。

验证：

- `node --check desktop-photo-pet/main.cjs && node --check desktop-photo-pet/preload.cjs && node --check desktop-photo-pet/runtime.js` 通过。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- Browser renderer 辅助验证三处页面均显示照片级 Mochi，Playwright console errors=0、warnings=0，motion manifest 请求 200。
- Electron 实际验证：启动 `npm run dev` 后显示 `AI Pet Photo Desktop Pet`；点击桌宠打开 `AI Pet Digital Twin MVP` 应用窗口后桌宠消失；关闭应用窗口后桌宠重新出现。
- Electron 实际验证：对话页、状态页、我的装扮页大预览均显示照片级 Mochi 动作帧。

注意：

- `desktop-app/main.cjs` 仍可用于单独调试应用窗口，但不能用它验证桌宠显隐联动；显隐联动必须走 `desktop-photo-pet` 集成入口。

## 市集与社区真实素材替换

根据用户要求，市集和社区不再使用渐变占位图标，改为联网检索并下载真实商品图和宠物场景图到本地 `public/assets/`，避免 Electron 运行时依赖外站热链。

本轮改动：

- 新增市集素材目录：`public/assets/market/`。
  - `pro-plan-salmon.png`：Purina Pro Plan Sensitive Skin & Stomach Salmon & Rice 主粮图。
  - `earth-rated-wipes.png`：Earth Rated 无香宠物清洁湿巾图。
  - `ikea-utsadd-snuffle.jpg`：IKEA UTSÅDD 嗅闻垫图。
  - `zesty-paws-allergy.jpg`：Zesty Paws Allergy & Immune Bites 图。
  - `purebites-salmon.png`：PureBites 冻干三文鱼零食图。
  - `ruffwear-sun-shower.png`：Ruffwear Sun Shower 防雨披风图。
- 新增社区素材目录：`public/assets/community/`。
  - `dogs-drinking-water.jpg`、`puppy-scratching-ear.jpg`、`dog-raincoat.jpg`、`corgi-leash-grass.jpg`。
  - 按用户补充要求新增 `dog-vet-checkup.jpg`、`dog-training-treat.jpg`，把社区页从 4 个帖子补到 6 个帖子。
- `src/App.tsx`
  - 市集商品数据增加 `image`、`imageAlt`、`sourceName`、`sourceUrl`。
  - 商品卡片和商品详情渲染真实商品图，并保留图片来源。
  - 社区帖子数据增加真实场景图和来源字段，并新增“兽医复查”“奖励训练”两个内容项。
  - 社区帖子详情从瀑布流底部移到搜索框下方，点击帖子后立即可见。
- `src/styles.css`
  - 为真实商品图增加 `object-fit: contain`、阴影和卡片内裁切。
  - 为社区照片增加 `object-fit: cover`、详情大图和来源样式。

素材来源：

- Purina、Decker's Dog + Cat、IKEA、Target、PureBites、Ruffwear。
- Pexels 免费图库页面：饮水、抓挠、雨衣、牵引散步、兽医复查和训练奖励场景。

验证：

- `npm run typecheck` 通过。
- `npm run build` 通过。
- Browser 验证市集 6 张商品图全部 `complete=true` 且有原始尺寸。
- Browser 验证社区列表和帖子详情真实图片加载正常，console 未出现 error。
- 用户补充后复验：社区页 `post-card` 数量为 6，6 张社区图全部 `complete=true` 且有原始尺寸；console errors=0。
- 用户再次指出当前 app 首屏仍只看到 4 个卡片后，已修正验收口径并调整 `.community-screen` 为首屏 2x3 紧凑布局；Playwright 在 `860x1836` 视口验证 6 个 `.post-card` 全部在当前 viewport 内，且 `.community-screen` 的 `scrollHeight = clientHeight = 838`。
- 验证截图：
  - `/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/real-assets-v5/market-real-products.png`
  - `/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/real-assets-v5/community-real-posts.png`
  - `/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/real-assets-v5/community-real-post-detail.png`
  - `/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/real-assets-v6/community-six-real-posts.png`
  - `/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/real-assets-v6/community-six-real-posts-bottom.png`
  - `/Users/rencan/ai-pet-system/reports/application-window-ui-2026-05-30/real-assets-v7/community-six-visible-current-app.png`

## 对话页与我的页宠物身份同步

根据用户纠正，本轮只以 Electron 应用窗口为最终验收目标，不把 localhost/HTML 调试页作为产品页面。修复目标是让对话页的名字和头像与“我的装扮”页引用同一份宠物资料。

本轮改动：

- `src/domain/types.ts`：`PetProfile` 增加 `displayName`，当前 Mochi 档案设置为“旺财”。
- `src/domain/profile.ts`：新增 `getPetDisplayIdentity()` 和 `getPetGroupName()`，统一输出页面可见名字和头像 URL。
- `src/App.tsx`：新增 `PetProfileAvatar`，对话页消息头像和“我的装扮”页头像都复用该组件；对话页标题、成员标签和消息作者改为“旺财”。
- `src/App.tsx`：社区页首条宠物动态的标题和作者也从同一个显示名生成，避免应用内切页后露出旧名字。
- `src/domain/agent.ts`、`server/agent.ts`：Agent persona、初始消息、本地 fallback 和 OpenAI Agents SDK agent name 跟随 `PetProfile` 可见身份，不再在对话页继续显示独立“科技狗”名字。
- `docs/product/product-spec-2026-05-30.md`、`docs/modules/agent-chat-2026-05-30.md`、`docs/modules/INDEX.md`：同步记录对话页可见名字/头像必须来自 `PetProfile`。

验证：

- `npm run typecheck` 通过。
- `npm run build` 通过。
- `npx tsx` 本地检查确认 persona group 为“旺财家庭群”，初始消息和 fallback 文案均使用“旺财”。
- Electron 应用窗口验证：`AI_PET_LOAD_DIST=1 npm run dev:app` 后通过 Computer Use 检查 `file://dist/index.html` 的真实 Electron 窗口。
- Electron 对话页验证结果：标题为“旺财家庭群”，副标题为“旺财 · 主人 · 主群聊”，消息作者为“旺财”，消息头像节点为“旺财 头像”图像。
- Electron “我的装扮”页验证结果：顶部头像节点同为“旺财 头像”图像，标题为“旺财”。

## 对话页消息名字与头像纵向绑定

根据用户指出“名字应该在头像的上方”，本轮修正 Electron 应用窗口对话页里的宠物消息身份布局。

本轮改动：

- `src/App.tsx`：宠物消息新增 `message-identity` 身份列，将 `message.authorName` 和 `PetProfileAvatar` 放到同一列；宠物消息内容列只保留气泡和工具卡。
- `src/styles.css`：新增 `.message-identity`，让宠物名居中位于头像上方；宠物消息气泡顶部与头像顶部对齐；用户消息布局保持原样。

验证：

- `npm run typecheck` 通过。
- `npm run build` 通过。
- Electron 应用窗口验证：`AI_PET_LOAD_DIST=1 npm run dev:app` 后通过 Computer Use 检查真实窗口，对话页宠物消息节点顺序为 `文本 旺财` -> `旺财 头像` -> 消息气泡，视觉上名字已位于头像上方。

## 应用窗口关闭后恢复桌宠

根据用户反馈，应用窗口打开后缺少可见关闭按钮，导致用户无法关闭窗口，也就无法触发桌宠恢复逻辑。本轮补齐应用窗口关闭入口，但仍保持桌宠恢复由主进程 `closed` 事件统一处理。

本轮改动：

- 新增 `desktop-photo-pet/app-preload.cjs`，给应用窗口 renderer 暴露 `window.aiPetAppWindow.close()`，并预留 `onNavigate` 接收桌宠目标视图跳转。
- `desktop-photo-pet/main.cjs`：应用窗口挂载 preload，新增 `ai-pet-app-window:close` IPC，由主进程关闭当前 `BrowserWindow`。
- 早期尝试曾在 React 顶栏加入 `X` 关闭按钮；最终可验收关闭入口改为 Electron 主进程注入 overlay，避免真实窗口继续加载旧 bundle 时没有关闭键。
- `src/App.tsx`：读取 `?view=chat/status/outfit/tasks` 初始目标视图，并接收后续 `ai-pet:navigate` 事件，保证桌宠点击打开窗口时可进入目标页。
- 新增修复记录：`docs/fix-records/2026-05-30-application-window-close-restore-desktop-pet.md`。

验证：

- `npm run typecheck` 通过。
- `node --check desktop-photo-pet/main.cjs`、`node --check desktop-photo-pet/app-preload.cjs`、`node --check desktop-photo-pet/preload.cjs` 通过。
- `npm run build` 通过。
- Playwright 浏览器截图 `/tmp/e2e-verify-ai-pet-chat-04-close-button.png`：左上角显示明确 `X` 关闭按钮，console error/warning 为 0，failed request 为 0。
- Playwright Electron smoke：初始只有 `AI Pet Photo Desktop Pet` 可见；点击桌宠后 `AI Pet Digital Twin MVP` 可见且桌宠隐藏；点击 `关闭应用窗口` 后应用窗口关闭，桌宠窗口恢复可见。

二次修正：

- 用户截图证明真实运行窗口仍然没有关闭键。Computer Use 检查确认真实窗口来自 `desktop-app/main.cjs` standalone 入口，URL 为 `file:///Users/rencan/ai-pet-system/ai-pet/dist/index.html`，辅助树中左上按钮仍为 `back`。第一轮验证错误在于只验证了新启动的 `desktop-photo-pet` 测试实例，没有检查用户屏幕上的真实旧窗口。
- 新增 `desktop-app/preload.cjs`，并更新 `desktop-app/main.cjs`，让 standalone 调试入口也支持 `window.aiPetAppWindow.close()` 和 `ai-pet-app-window:close` IPC。
- 已停止旧 `desktop-app/main.cjs` Electron 进程，并启动正确的 `desktop-photo-pet/main.cjs` 集成入口。
- Computer Use 真实窗口验证：点击桌宠后应用窗口左上角按钮名为 `关闭应用窗口`；点击该按钮后应用窗口关闭，`AI Pet Photo Desktop Pet` 桌宠窗口恢复可见。
- Playwright Electron 二次 E2E 证据目录：`/tmp/e2e-verify/ai-pet-close-restore-real-window/`。
  - `01-desktop-pet-visible.png`：初始桌宠可见。
  - `02-app-window-close-button.png`：应用窗口左上角显示 `X`，accessible name 为 `关闭应用窗口`。
  - `03-desktop-pet-restored.png`：点击关闭后桌宠恢复可见。

## 关闭按钮、Agent 动作和桌宠恢复端到端收敛

根据用户再次反馈，上一轮没有在真实 App 中完成关闭按钮、桌宠恢复、Agent 动作联动和知识库回写。本轮按真实 Electron 集成入口重做验收，不再把浏览器或错误 standalone 窗口当成最终结果。

本轮改动：

- `desktop-photo-pet/main.cjs`
  - 应用窗口继续由 `closed` 事件统一恢复桌宠。
  - 新增主进程注入的 `关闭应用窗口` overlay，避免 React bundle、旧 `dist` 或 standalone 入口漂移导致真实窗口没有关闭键。
  - 加载应用窗口时追加 cache-bust query，并使用临时 session partition，降低旧缓存影响。
- `desktop-app/main.cjs`
  - standalone 调试入口同步接入 preload IPC、主进程注入关闭 overlay 和 cache-bust，避免调试窗口继续误导真实验收。
- `server/agent.ts`
  - 明确动作请求先生成 `request_pet_motion` 工具调用、工具卡片和动作命令，再用 llmmelon Chat Completions 生成宠物口吻回复。
  - llmmelon 动作快路径支持 `LLMMELON_FAST_MOTION_MODEL`，默认使用当前主模型，25 秒超时并短重试；模型失败时仍返回本地动作兜底，保证 UI 不静默卡住。
- `src/components/MochiMotionAvatar.tsx`
  - 顶部宠物形象改为预加载动作帧后用 canvas 绘制，避免逐帧 `<img src>` 切换造成 Electron active network abort。
- `index.html`
  - 增加 Electron renderer CSP，消除开发态 console warning。
- 知识库
  - 更新关闭恢复修复记录和 Agent 动作 E2E 修复记录。

验证：

- `npm run typecheck` 通过。
- `npm run build` 通过。
- `node --check desktop-photo-pet/main.cjs`、`node --check desktop-photo-pet/app-preload.cjs`、`node --check desktop-app/main.cjs`、`node --check desktop-app/preload.cjs` 通过。
- 直接 API 验证 `/api/agent/chat`：输入“旺财，回头看一下，然后告诉我你在做什么”，返回 `provider = llmmelon-direct`、`model = claude-sonnet-4-6`、`motionCommand.action = look_back`，工具卡片包含 `桌宠动作`。
- 最终 Playwright Electron E2E 证据目录：`/tmp/e2e-verify/ai-pet-integrated-close-agent-motion-llmmelon-final/`。
  - `01-desktop-pet-visible.png`：初始桌宠窗口可见。
  - `02-app-window-chat-before-action.png`：点击桌宠打开应用窗口，左上角 `关闭应用窗口` 可见；顶部宠物区固定，聊天区独立滚动。
  - `03-agent-request-sent.png`：发送动作请求后出现 loading。
  - `04-agent-motion-replied.png`：llmmelon 回复出现，工具卡片为 `桌宠动作回头看`，动作状态为 `正在回头看`。
  - `05-desktop-pet-restored-after-close.png`：点击关闭后桌宠恢复。
  - `summary.json`：`apiResponses[0].provider = "llmmelon-direct"`、`motion = "look_back"`、`failedRequests = []`、`consoleIssues = []`，关闭后窗口列表只剩 `AI Pet Photo Desktop Pet`。

## 用户激励信息架构与可点击闭环

根据用户纠正，本轮先把用户激励信息架构写入权威知识库，再改应用窗口实现。核心口径是：“我的”页保留宠物档案、宠物知识库入口和装扮区，只增加“用户激励”入口；用户激励页独立承载每日任务、排行榜和奖励/可解锁服饰三个详情页；装扮页中标注奖励获得的物品必须能在奖励页看到解锁来源。

本轮知识库更新：

- 新增 `docs/modules/user-incentive-2026-05-31.md`。
- 同步产品规格、产品逻辑框架、当前系统架构、技术架构、模块索引、功能范围、知识库缺口记录和根索引。
- 修复记录 `docs/fix-records/2026-05-31-incentive-loop-and-thread-id-ui-leak.md` 标记为已修复，并写入验证结果。

本轮应用窗口改动：

- `src/App.tsx`
  - “我的”页不再是入口集合；保留宠物档案、用户激励入口、宠物知识库入口和装扮区。
  - 用户激励页展示今日积分、本周积分、连续天数、任务完成数、当前排名和奖励进度。
  - 每日任务详情页可点击完成任务，完成后积分、连续天数、排名和奖励进度联动更新。
  - 排行榜详情页条目可点击并展示明细。
  - 奖励/可解锁服饰页展示巡逻奖章、生日丝巾和连续照护徽章的来源、条件和进度。
  - 装扮页的奖励物品显示未解锁/已解锁状态和解锁条件，未解锁时不直接保存。
- `src/styles.css`
  - 补齐用户激励、任务、排行、奖励和装扮奖励状态样式。
  - 修复用户激励子页返回按钮被 sticky 标题拦截的问题。
  - 调整“我的”页 sticky 顶部遮罩，避免滚动后标题与装扮标签叠读。

验证：

- `npm run typecheck` 通过。
- Playwright 浏览器 E2E 证据目录：`/tmp/e2e-verify/ai-pet-user-incentive-v2/`。
  - `01-my.png`：“我的”页保留档案、用户激励入口、知识库入口和装扮区。
  - `02-incentive.png`：用户激励独立页显示积分、任务、排名和奖励入口。
  - `03-tasks-before.png` / `04-tasks-after.png`：每日任务显示详情，点击任务后积分从 `29/213` 更新到 `69/213`，完成数从 `1/6` 更新到 `2/6`。
  - `05-incentive-after-task.png`：用户激励摘要联动为本周 `387` 分、排名 `#3`。
  - `06-leaderboard-detail.png`：排行榜条目可点击，详情切换到 `#1 Nori`。
  - `07-rewards.png`：奖励页显示巡逻奖章、生日丝巾和连续照护徽章的来源、条件和进度。
  - `09-outfit-locked-fixed.png`：装扮页未解锁生日丝巾显示对应解锁条件。
- 当前 5180 页面新增 console warning/error 为 0；非静态网络请求均为 200。

## 用户激励子页返回与关闭按钮避让

用户反馈 Electron 应用窗口中“用户激励”子页左上角同时出现全局关闭 `X` 和页面返回箭头，视觉上和点击层级都拥挤。本轮明确导航层级：窗口级关闭按钮独占左上角，页面级返回移到标题区域右上角。

本轮改动：

- `src/styles.css`
  - `.my-back-button` 从左上角圆形图标改为右上角文字胶囊。
  - 使用 `aria-label` 显示 `返回我的` / `返回用户激励` 文案。
  - 调整 `.my-subpage-header .mobile-top-nav` 的左右 padding，避免返回胶囊压住标题。
- 新增修复记录 `docs/fix-records/2026-05-31-incentive-subpage-back-close-overlap.md`，并加入知识库索引。

验证：

- `npm run typecheck` 通过。
- Playwright 浏览器验证时注入与 Electron 相同位置的关闭 X，确认关闭 X 在左上角、页面返回在右上角，不再重叠。
- 截图：`/tmp/e2e-verify/ai-pet-incentive-back-close-overlap/01-user-incentive-close-back-separated.png`。
- 点击 `返回我的` 能回到“我的”页；新增 console warning/error 为 0，非静态网络请求均为 200。
