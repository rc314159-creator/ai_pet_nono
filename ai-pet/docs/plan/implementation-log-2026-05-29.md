# MVP 实现记录

日期：2026-05-29

> 2026-05-30 后产品口径已更新：项目没有 HTML 展示页；用户第一入口是系统级桌宠，点击桌宠后弹出应用窗口/功能面板。本文是历史实现记录，其中 “Web 端口” 指当时 React/Vite 应用窗口的开发端口，不代表产品形态是网页展示页。

## 本轮完成

- 创建 `ai-pet` MVP 应用。
- 技术栈：React + Vite + TypeScript + Express API。
- API 端口：`http://127.0.0.1:8788`。
- 应用窗口开发端口：`http://127.0.0.1:5180`。
- LLM 策略：优先使用 llmmelon；当前环境未设置 `LLMMELON_API_KEY`，所以 demo 使用本地规则模型兜底。

## 已实现功能

- 真实宠物档案：
  - Mochi：柯基，鸡肉过敏，肠胃敏感，季节性皮肤瘙痒。
  - Luna：银虎斑猫，毛球倾向。
- 虚拟宠物形象：
  - 根据宠物 species、appearance、avatar palette 渲染宠物形象。
  - 展示对应拟人形象。
- Mock 设备数据：
  - 14 天日汇总。
  - 48 个实时流数据包。
  - 仿 FitBark：BarkPoints、activity index、rest/active/play、sleep score、health index、calorie、distance。
  - 仿 Tractive：activity、sleep、GPS/geofence、heart rate、respiration、bark/scratch、health trends。
  - 仿 PetPace：heart rate、respiration、skin temperature、posture、stress signal。
- 绑定模式：
  - 可切换设备绑定/手动模式。
  - 绑定时实时包随定时器推进。
- 虚拟状态机：
  - fullness、mood、energy、cleanliness、friendship、hydration、fitnessTrend。
  - 健康 flags：activity_below_baseline、scratch_above_baseline、sleep_quality_low、water_intake_low、geofence_attention、stress。
- 每日任务：
  - 喂食、遛狗、休息恢复、皮肤复查、换水、补货。
  - 每个任务有原因、优先级、时间窗口、风险等级。
- 互动：
  - 喂食、玩玩具、局部护理、休息会改变虚拟状态。
- AI 问答：
  - 前端问答面板。
  - `/api/ask` 接口。
  - llmmelon 未配置时使用本地规则回答，保证 demo 可运行。
- 库存和电商推荐：
  - 主粮、清洁湿巾、零食、玩具库存。
  - 库存不足或护理任务触发商品推荐。
  - 推荐会检查鸡肉过敏、肠胃敏感和护理场景。
- 社区挑战：
  - 展示晨间巡逻赛、睡眠挑战排行榜。
  - 当前为预留展示，不进入核心闭环。
- 桌面宠物桥接：
  - `npm run dev` 默认启动应用窗口、API 和 OpenPets 桌宠运行时。
  - 新增 `/api/desktop-pet/status`，读取 OpenPets CLI 状态。
  - 新增 `/api/desktop-pet/say`，把 AI Pet 生成的 Mochi 提醒发送到 OpenPets 桌宠气泡。
  - 前端新增“桌面宠物桥接”面板，显示 connected/offline、运行时版本、窗口可见状态，并支持手动同步。
  - 喂食、玩玩具、局部护理、休息等互动会同步桌宠反馈。

## 验证

- `npm install` 成功，0 vulnerabilities。
- `npm run typecheck` 通过。
- `npm run build` 通过。
- API 验证：
  - `GET /api/health` 返回 `ok=true`，当前为 `local-fallback`。
  - `POST /api/ask` 能对“主粮够不够？推荐什么商品？”返回规则答案。
- Playwright 验证：
  - 打开 `http://127.0.0.1:5180/`，标题为 `AI Pet Digital Twin MVP`。
  - 桌面 viewport 无横向溢出。
  - 390px 移动 viewport 无横向溢出。
  - 点击“喂食”后状态变化。
  - 点击“今天要不要给 Mochi 洗澡？”后问答返回本地规则答案。
  - console 无 warning/error。

## 当前限制

- OpenPets 桌面运行时已接入当前 `ai-pet` 应用窗口/API，可显示来自 Mochi 档案、任务和状态的气泡提醒；但当前仍使用 OpenPets built-in pet，尚未导入 Mochi 专属 pet pack。
- 尚未接入 opencode/MCP；下一步应把同一套 domain tools 暴露为 MCP。
- `LLMMELON_API_KEY` 当前环境未设置，llmmelon 调用路径已实现但未实测真实 key。
- 商品为 mock catalog，未接真实电商。
- 设备为 mock adapter，未接真实硬件 API。

## 桌宠接入验证 2026-05-29 22:24 +08:00

- `npm run typecheck` 通过。
- `npm run build` 通过。
- 停掉手动分离启动的应用窗口/API/OpenPets 后，重新执行 `npm run dev`，确认 `api`、`web`、`pet` 三路由同一命令启动。
- `GET /api/health` 返回 `desktopPet=openpets-discovered`。
- `GET /api/desktop-pet/status` 返回 `connected=true`、`appRunning=true`、`defaultPetVisible=true`。
- `POST /api/desktop-pet/say` 返回 `ok=true` 和 `OpenPets message sent.`。
- 浏览器验证：`http://127.0.0.1:5180/` 显示“桌面宠物桥接”面板，状态为 `connected`，显示 `Built-in Pet`、窗口 `可见`，存在“同步到桌宠”按钮。
- 桌面验证：Computer Use 观察到 `OpenPets Default Pet` 窗口气泡文本 `一键启动验证：AI Pet MVP 已包含桌面宠物。`

## 复跑验证 2026-05-29 22:16 +08:00

- `npm run dev` 启动成功：应用窗口开发服务为 `http://127.0.0.1:5180/`，API 为 `http://127.0.0.1:8788`。
- `/api/health` 返回 `ok=true`，LLM 为 `local-fallback`。
- `/api/ask` 可返回洗澡问题的规则答案。
- 浏览器打开应用窗口开发服务成功，点击“喂食”按钮可交互。
- OpenPets 从 `/Users/rencan/Library/Application Support/MeetingCopilot/sessions/2026-05-09T02-18-28Z/pet-sandbox-repos/openpets` 启动成功。
- `node packages/cli/dist/index.js status` 返回 `appRunning=true`、`defaultPetVisible=true`。
- `node packages/cli/dist/index.js say ... --reaction success` 可让 OpenPets 桌宠显示消息；Computer Use 观察到窗口 `OpenPets Default Pet`。

## 下一步

1. 把 domain engine 包装为 `ai-pet-mcp-server`。
2. 用 opencode 接入 MCP，验证 agent 调 `get_pet_profile`、`plan_daily_tasks`、`virtual_pet_say`。
3. 导入或生成 Mochi 专属 OpenPets pet pack，替换当前 built-in pet。
4. 设置 `LLMMELON_API_KEY` 后实测 `/api/ask` 的真实 llmmelon 路径。
