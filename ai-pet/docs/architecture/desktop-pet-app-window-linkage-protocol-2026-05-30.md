---
title: 桌宠点击到应用窗口联动协议
description: 明确桌宠点击打开应用窗口的基础跳转协议，以及手环数据、随机动作和 agent 动作工具调用驱动桌宠动作时的优先级仲裁。
status: 已批准
created: 2026-05-30
updated: 2026-05-30
update_reason: 根据用户澄清，桌宠联动包含基础跳转逻辑和动作联动优先级两套逻辑，需要写入知识库供并行开发使用。
doc_type: architecture-protocol
domain_taxa:
  - desktop-runtime
  - app-window
  - data-contract
  - domain-service
related:
  - technical-architecture-2026-05-30.md
  - ../product/product-spec-2026-05-30.md
  - ../modules/INDEX.md
  - ../plan/parallel-development-workstreams-2026-05-30.md
---

# 桌宠点击到应用窗口联动协议

## 结论

桌宠与应用窗口之间不是一条单一链路，而是两套独立但共享状态的协议：

1. 基础跳转协议：用户点击桌宠时，桌面程序打开或聚焦应用窗口。
2. 动作联动协议：桌宠当前动作由多种来源共同驱动，并按优先级仲裁；对话页不直接控制动作，动作能力作为 tool/interface 暴露给 agent。

这两套协议都不等同于 HTML 页面跳转。产品形态仍然是系统级桌宠 + 桌面程序应用窗口。

## 协议一：基础跳转逻辑

### 触发

用户点击桌宠本体、桌宠气泡、异常提醒或轻交互入口时，桌宠运行时发出 `pet.open_app_window` 事件。

### 行为

- 如果应用窗口未启动：启动 Electron 应用窗口。
- 如果应用窗口已启动但在后台：聚焦已有窗口。
- 如果带有目标视图：跳转到对应应用窗口页签。
- 如果没有目标视图：默认进入陪伴对话页。

### 最小事件字段

```ts
type AppWindowTargetView = "chat" | "status" | "outfit" | "tasks";

type OpenAppWindowEvent = {
  type: "pet.open_app_window";
  source: "desktop_pet";
  targetView?: AppWindowTargetView;
  reason: "pet_click" | "bubble_click" | "alert_click" | "task_click" | "outfit_click";
  contextId?: string;
  createdAt: string;
};
```

### 路由约定

| 触发来源 | 默认目标 |
|---|---|
| 点击桌宠本体 | `chat` |
| 点击异常气泡 | `status` |
| 点击照护任务提醒 | `tasks` |
| 点击换装/装扮反馈 | `outfit` |

基础跳转协议只负责打开窗口和定位视图，不负责决定桌宠播放什么动作。

## 协议二：动作联动逻辑

桌宠动作由 `ExpressionAdapter` 或后续等价的 `MotionArbiter` 统一仲裁。应用窗口、领域状态、手环数据、agent 和桌宠自身随机动作都不能直接抢占渲染器，必须提交动作命令。

对话页只负责承载用户和 agent 的上下文对话。用户说“请转个圈”时，不是对话页直接解析并控制桌宠，而是 agent 在对话上下文中判断应该调用 `request_pet_motion` 工具，由工具提交最高优先级动作命令。

### 动作来源与优先级

| 优先级 | 来源 | 说明 | 例子 |
|---:|---|---|---|
| 100 | Agent 对话动作工具调用 | 最高优先级。agent 在陪伴对话中决定调用 `request_pet_motion` 时，覆盖手环映射和随机动作。 | 用户说“请转个圈”，agent 调用工具让桌宠执行 `spin` |
| 60 | 指令触发的随机动作 | 中优先级。agent、桌宠轻交互或演示指令要求桌宠随机做一个动作时，覆盖默认手环映射，但不能覆盖 agent 的明确动作工具调用。 | “随机卖萌一下”，桌宠从动作池选 `jump` |
| 30 | 手环/设备数据映射的默认状态 | 基线优先级。动物手环记录真实宠物动作或状态后，经领域层映射到桌宠默认动作。 | 手环识别到走动，桌宠进入 `walk` |

当前 MVP 按 `agent 动作工具调用 > 指令触发的随机动作 > 手环/设备数据默认映射` 仲裁。

### 默认状态：手环数据到桌宠动作

手环或 mock 设备数据进入证据流后，由领域层转为宠物状态，再映射为桌宠动作。这个方向是“应用窗口/领域状态影响桌宠”。

示例映射：

| 设备/证据状态 | 桌宠动作 |
|---|---|
| `walking` | `walk` |
| `resting` | `idle` |
| `sleeping` | `sleep` |
| `eating` | `eat` |
| `scratching` | `scratch` |
| `barking` | `bark` |
| `low_activity` | `tired_idle` |

默认映射持续更新，但不能打断更高优先级动作。高优先级动作结束后，桌宠回到最新的默认映射状态。

### 随机动作

随机动作必须来自明确指令或明确策略，例如用户轻触桌宠、agent 要求“随机卖萌一下”、演示按钮触发随机动作池。随机动作不是手环数据本身。

随机动作规则：

- 只从当前宠物已加载动作包中选择可用动作。
- 可以覆盖手环默认动作。
- 不能覆盖正在执行的 agent 动作工具调用。
- 执行完成或超时后，回到最新的手环默认映射。

### Agent 对话动作工具调用

用户在陪伴对话页对宠物提出动作请求时，请求先进入 agent。agent 结合对话上下文、宠物状态和可用动作包后，决定是否调用 `request_pet_motion` 工具。该工具调用拥有最高优先级。

例子：

- “请转个圈” -> `spin`
- “跳一下” -> `jump`
- “坐下” -> `sit`
- “过来一下” -> `come_closer`

Agent 动作工具调用规则：

- 立即覆盖手环默认动作和随机动作。
- 执行期间其他低优先级动作进入等待或被丢弃。
- 动作完成后，桌宠恢复到最新的手环默认状态。
- 如果动作包不支持该动作，应用窗口应给出自然语言反馈，桌宠可退化为 `nod`、`idle_happy` 或气泡提示。

## 动作命令契约

```ts
type ExpressionCommandSource =
  | "bracelet_mirror"
  | "random_action"
  | "agent_tool_call";

type ExpressionCommand = {
  id: string;
  target: "desktop_pet";
  source: ExpressionCommandSource;
  action: string;
  priority: 30 | 60 | 100;
  reason: string;
  createdAt: string;
  ttlMs?: number;
  interruptible?: boolean;
  context?: {
    evidenceEventId?: string;
    messageId?: string;
    conversationId?: string;
    targetView?: "chat" | "status" | "outfit" | "tasks";
  };
};
```

## 仲裁规则

1. 新动作命令进入队列后，先比较 `priority`。
2. 高优先级动作立即抢占低优先级动作。
3. 同优先级动作默认以后到者为准；如果当前动作标记为 `interruptible: false`，则等待当前动作完成或超时。
4. `ttlMs` 到期后，动作命令自动失效。
5. 队列为空时，桌宠回到最新的 `bracelet_mirror` 默认动作。
6. 渲染器只播放仲裁后的动作，不直接理解业务来源。

## 并行开发归属

| 工作流 | 负责内容 |
|---|---|
| 工作流 B：Mock 数据与领域状态整理 | 手环/mock 设备数据进入证据流，并映射出默认桌宠动作 |
| 工作流 C：桌宠点击到应用窗口联动协议 | 基础跳转事件、窗口聚焦、目标视图路由、事件字段 |
| 工作流 D：Agent/OpenCode Runtime 与工具接入 | 把 `request_pet_motion` 暴露给 agent，并把 agent 工具调用转成 `agent_tool_call` 动作命令 |
| 工作流 E：桌宠形象与动作包线 | 动作包、动作播放器、动作命令仲裁和视觉执行 |

跨工作流实现时必须遵守本协议，不能让某一端绕过动作命令队列直接控制桌宠。
