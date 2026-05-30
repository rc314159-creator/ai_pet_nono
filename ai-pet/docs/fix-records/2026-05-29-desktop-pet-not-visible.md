# 桌面宠物未出现问题记录

日期：2026-05-29

> 历史问题记录。2026-05-30 后当前产品口径已更新为“系统级桌宠 + 点击后应用窗口”，项目没有 HTML 展示页。本文中的 “Web demo” 是当时实现状态的历史描述，不代表当前产品形态。

## 事实时间线

- 2026-05-29 17:59 左右，MVP 实现记录显示当前成果是 React + Vite + TypeScript + Express API 的前端 demo，当时尚未形成“桌宠点击后应用窗口”的产品口径。
- 该实现记录同时写明限制：尚未真正接入 OpenPets 桌面宠物，尚未接入 opencode/MCP。
- 用户再次要求“实际运行一下”，并反馈“我并没有看到桌面宠物”。

## 证据引用

- `docs/plan/implementation-log-2026-05-29.md`：当时实现为前端 demo，端口为 `127.0.0.1:5180` 和 `127.0.0.1:8788`。
- `docs/plan/implementation-log-2026-05-29.md`：当前限制包含“尚未真正接入 OpenPets 桌面宠物”和“尚未接入 opencode/MCP”。
- `docs/plan/mvp-plan.md`：阶段 0 的验收标准是 `opencode` 调 `get_pet_profile` 后调用 `virtual_pet_say` 让 OpenPets 桌宠回复。
- 当前代码目录只包含 `src/`、`server/`、Vite/Express 配置；项目内没有 OpenPets 运行时或 MCP server。

## 根因

上一轮把前端 demo 的可运行状态说成了 MVP 进展主体，但没有把“桌面宠物窗口实际未接入”作为当前阻塞强调清楚。当前实现没有启动或集成 OpenPets，因此用户只会看到开发期前端视图，不会看到系统级桌面宠物窗口。

## 修复计划

1. 实际启动当前 `ai-pet` Web/API demo，确认浏览器 demo 是否正常。
2. 查找本机 OpenPets 安装或 overnight 验证产物，确认是否有可复用的桌面运行入口。
3. 若 OpenPets 可启动，先独立启动桌宠并验证 `say/status` 控制；再记录与当前前端 demo 尚未桥接的事实。
4. 若 OpenPets 运行入口缺失，把下一步收敛为：引入 OpenPets 仓库/依赖，新增 `ai-pet-mcp-server`，把 domain engine 工具和 OpenPets `say/react` 控制串起来。

## 本轮实际验证

- 已启动 `ai-pet`：Web 监听 `http://127.0.0.1:5180/`，API 监听 `http://127.0.0.1:8788`。
- `GET /api/health` 返回 `ok=true`，LLM 状态为 `local-fallback`。
- `POST /api/ask` 对“今天要不要给 Mochi 洗澡？”返回本地规则答案。
- 浏览器打开 `http://127.0.0.1:5180/`，标题为 `AI Pet Digital Twin MVP`，点击“喂食”按钮可交互。
- 已从本机 overnight 仓库启动 OpenPets：`pnpm dev:desktop`，Electron 进程 pid 为 `79777`。
- OpenPets CLI `status` 返回 `appRunning=true`、`defaultPetVisible=true`。
- OpenPets CLI `say` 已发送一条 Mochi 相关消息，Computer Use 观察到桌面窗口 `OpenPets Default Pet` 和默认橙色 built-in pet。

## 当前结论

桌面宠物运行时已接入当前 `ai-pet` Web/API，能显示来自 Mochi 档案、任务和状态的气泡提醒。当前仍是 OpenPets built-in pet，不是 Mochi 专属形象；下一步需要导入或生成 Mochi pet pack，并继续把 domain engine 暴露为 MCP tools。
