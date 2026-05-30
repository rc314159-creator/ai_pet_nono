# AI/Agent 底座调研

日期：2026-05-29

## 选型原则

我们不想做 LangChain 式大量 glue code，也不想自己实现完整 agent loop、工具路由、上下文管理、权限确认和模型接入。MVP 应该复用已经成熟的 agent runtime，然后只暴露宠物业务工具。

## 第一候选：opencode + MCP

- 项目：[anomalyco/opencode](https://github.com/anomalyco/opencode)
- 文档：[opencode docs](https://opencode.ai/docs/)
- GitHub CLI 校验时间：2026-05-29，仓库描述为 `The open source coding agent.`，许可证 MIT。
- 适合原因：
  - 终端原生 agent，已经有模型 provider、命令执行、文件编辑、工具调用、会话等基础能力。
  - 支持 MCP server，可以把我们的宠物系统以工具形式接进去。
  - 比 LangChain 更接近“现成 agent 产品”，我们主要开发 MCP tools 和业务服务。
- 预期接法：
  - `ai-pet-mcp-server` 暴露真实宠物档案、健康数据、每日任务、库存、商品推荐和桌宠控制工具。
  - opencode 负责 reasoning、调用工具、汇总回复、和用户交互。
  - OpenPets 负责可视化输出：`say`、`react`、`move`。
- 必做工具：
  - `get_pet_profile`
  - `get_live_metrics`
  - `get_virtual_pet_state`
  - `plan_daily_tasks`
  - `record_care_event`
  - `record_inventory`
  - `recommend_products`
  - `virtual_pet_say`
  - `virtual_pet_react`
  - `virtual_pet_move`
- 风险：
  - opencode 是 coding agent，产品化成宠物助理要处理提示词、权限和 UI 包装。
  - 用户端不能直接暴露任意 shell/file 工具；宠物 app 里只启用受控 MCP tools。

## 备选：OpenHands

- 项目：[OpenHands/OpenHands](https://github.com/OpenHands/OpenHands)
- 适合原因：
  - 更像完整 autonomous agent 平台，有 runtime/sandbox 和 Web UI。
  - 能跑复杂任务。
- 不作为 MVP 主线原因：
  - 偏软件工程自动化，部署和运行时比 opencode 重。
  - 我们要的是轻量宠物助理，不是浏览器里的软件开发 agent。

## 备选：Goose

- 项目：[aaif-goose/goose](https://github.com/aaif-goose/goose)
- 适合原因：
  - 本地 agent、工具和 MCP 生态较强。
  - 可作为 opencode 不合适时的 agent runtime 备选。
- 不作为 MVP 主线原因：
  - 仍需要做产品 UI 和宠物业务工具封装。

## 备选：aider

- 项目：[Aider-AI/aider](https://github.com/Aider-AI/aider)
- 适合原因：
  - 成熟 CLI coding assistant。
- 不作为 MVP 主线原因：
  - 更专注代码编辑，不适合做长期运行的宠物问答/健康助理。

## 暂不采用：LangChain / CrewAI 类框架

原因不是不能用，而是不符合当前约束：

- 需要我们自己组织 agent loop、tool runtime、memory、权限、UI、错误恢复。
- 会把主要工程量转移到 agent 框架粘合层。
- 对 MVP 来说，直接使用 opencode/Goose/OpenHands 这类完整 agent 更省。

## Agent 底座裁决

第一版做 `opencode + MCP + OpenPets`：

1. opencode 作为现成 agent。
2. 我们只写受控 MCP tools，不暴露通用系统工具。
3. OpenPets 作为可视化状态通道。
4. 宠物业务服务提供档案、健康数据、任务、库存和推荐。

这个组合符合“不要从头开发 agent，也不要从头开发桌宠”的原则。
