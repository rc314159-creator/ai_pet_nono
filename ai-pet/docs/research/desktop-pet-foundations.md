# 开源桌面宠物底座调研

日期：2026-05-29

本页继承 overnight 实测结果。详细截图和运行日志见 `reports/pet-sandbox-overnight/`。

## 选型结论

### 第一候选：OpenPets

- 仓库：[alvinunreal/openpets](https://github.com/alvinunreal/openpets)
- 本地实测：可运行，CLI/MCP 控制宠物气泡成功。
- 适合原因：
  - 已有桌面宠物窗口、pet pack、catalog、插件 SDK。
  - 已有 CLI/MCP/IPC 控制链路，AI 可以发 `status`、`say`、`react`。
  - lease 机制适合把某个 agent 或任务绑定到某只宠物。
- 缺口：
  - 没有真实宠物档案、健康状态、库存、商品推荐。
  - 宠物照护状态机较弱。
- MVP 用法：
  - fork 或作为 renderer 依赖。
  - 新增 `ai-pet` pet pack 导入流程。
  - 通过 MCP tools 控制 `virtual_pet_say/react/move`。

### 第二候选：codex-pet-companion

- 仓库：[pixel-raccoon/codex-pet-companion](https://github.com/pixel-raccoon/codex-pet-companion)
- 本地实测：可运行。
- 适合原因：
  - 已有 Fullness、Mood、Energy、Focus、Friendship、Feed、Play、Rest。
  - 已有每日活动逻辑和 pet pack 结构。
  - 非常适合作为宠物照护状态机参考。
- 缺口：
  - 不是 AI agent 桌宠平台。
  - 没有外部 HTTP/MCP API。
- MVP 用法：
  - 不建议整套搬 UI。
  - 移植或重写核心 domain：状态衰减、冷却、每日活动、互动收益。

### 第三候选：DyberPet

- 仓库：[ChaozhongLiu/DyberPet](https://github.com/ChaozhongLiu/DyberPet)
- 本地实测：锁定依赖后可运行。
- 适合原因：
  - item、backpack、favorability、auto feed、dialogue、mini-pet 体系成熟。
  - 对“玩具、食物、清洁用品、好感度、自动投喂”有参考价值。
- 缺口：
  - LLM 模块未开源。
  - PySide 桌面端维护成本较高。
- MVP 用法：
  - 参考资源/背包/道具配置，不作为主 UI。

### Live2D 方向：BongoCat / AI-Desktop-Pet

- BongoCat：[ayangweb/BongoCat](https://github.com/ayangweb/BongoCat)
- AI-Desktop-Pet：[ruguo0119/AI-Desktop-Pet](https://github.com/ruguo0119/AI-Desktop-Pet)
- 本地实测：
  - BongoCat 构建可启动，但透明窗口截图不稳定。
  - AI-Desktop-Pet 前端可跑，Hiyori Live2D 模型加载成功，后端需环境变量。
- 适合原因：
  - Live2D/model3 导入和表情动作适合未来做更高级猫狗形象。
- 缺口：
  - 不是照护系统。
  - AI-Desktop-Pet 文档协议和代码实现不完全一致。
- MVP 用法：
  - 第一版不强依赖 Live2D。
  - 作为“高级形象模式”的第二阶段技术路线。

### 不建议作为主底座

- VPet：玩法参考价值高，但 Windows/WPF/Steamworks 平台绑定强。
- Shijima-Qt：HTTP mascot API 很清楚，但项目归档且构建失败。
- desktop-pet：依赖老化，macOS 不兼容。
- Alive：当前完整代码不再开源。
- Chatty_desktop_pet：Godot 方向，工具链重。

## 桌宠底座裁决

MVP 用 OpenPets 做可视化和 AI 控制壳；从 codex-pet-companion 和 DyberPet 抽业务逻辑；Live2D 只预留模型层接口，不进入第一版主路径。
