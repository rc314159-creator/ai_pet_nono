# 历史 MVP 实施计划

日期：2026-05-29

> 本文是早期计划，尚未完全同步 2026-05-30 已确认产品规格。当前执行前必须先读 [AI Pet 当前产品规格](../product/product-spec-2026-05-30.md)、[AI Pet 技术架构](../architecture/technical-architecture-2026-05-30.md)、[AI Pet 模块分类索引](../modules/INDEX.md) 和 [MVP 功能设计对齐](mvp-feature-design-2026-05-30.md)。本文中的早期“Web”表述统一按“桌宠点击后弹出的应用窗口/功能面板”理解。

## 原则

- 复用优先，不从零开发桌宠或 agent。
- 当前只有一版项目展示 Demo，不按多版本路线讨论；先跑通开发闭环，不追求最漂亮的形象。
- AI 只通过受控工具访问宠物数据。
- 医疗和购买都需要人工确认。

## 阶段 0：验证底座组合

目标：证明 `OpenPets + opencode + ai-pet MCP server` 能串起来。

任务：

- fork 或本地引用 OpenPets。
- 启动 OpenPets，并用 CLI/MCP 控制 `say/react`。
- 搭建最小 MCP server，暴露 `get_pet_profile` 和 `virtual_pet_say`。
- 在 opencode 中接入 MCP server，让 agent 读取宠物档案并驱动桌宠说话。

验收：

- 用户问“今天 Mochi 怎么样”，opencode 调 `get_pet_profile`，再调用 `virtual_pet_say` 让桌宠回复。
- MVP 开发启动脚本必须同时启动应用窗口/API 和 OpenPets；如果 OpenPets 没启动，界面必须明确显示未连接，不能把单独应用窗口当成完整 MVP。

## 阶段 1：真实宠物档案和虚拟状态

目标：有一只真实宠物和一个绑定的虚拟宠物。

任务：

- 建立 SQLite schema：PetProfile、VirtualPetState、CareEvent。
- 做宠物档案录入 JSON 或简单本地表单。
- 做 sprite pack 映射：species/breed/appearance -> avatarPackId。
- 移植基础状态机：fullness、mood、energy、cleanliness、friendship。

验收：

- 创建猫/狗档案后，虚拟宠物有对应形象和初始状态。
- 记录 feed/play/rest/clean 后状态变化。

## 阶段 2：每日任务

目标：AI 能根据宠物状态生成今日清单。

任务：

- 建立 DailyTask schema。
- 实现 `plan_daily_tasks` 工具。
- 规则优先：喂食、换水、遛狗、清洁、梳毛、洗澡、用药提醒。
- AI 负责解释和排序，不直接凭空编造医疗结论。

验收：

- 系统每天生成 3-6 个任务。
- 每个任务都有 reason、priority、due window、完成按钮/事件。

## 阶段 3：健康数据 adapter

目标：让真实数据影响虚拟宠物。

任务：

- 实现 ManualInputAdapter。
- 实现 MockWearableAdapter。
- 实现 CSV/JSON import。
- 设计 FitBark adapter 原型，但不阻塞 MVP。

验收：

- mock 数据显示今日活动少，系统生成遛狗/玩耍任务。
- 手动记录伤口观察，系统给出风险提示和就医边界说明。

## 阶段 4：库存和商品推荐

目标：把任务和电商推荐连起来。

任务：

- 建立 InventoryItem 和 ProductCatalog mock。
- 实现 `record_inventory` 和 `recommend_products`。
- 约束：过敏、疾病、年龄、体重、预算、当前品牌。
- 推荐输出：原因、适配点、禁忌检查、替代项。

验收：

- 当主粮剩余不足 2 天，且今天有喂食任务，系统推荐适合该宠物的主粮。
- 如果宠物鸡肉过敏，推荐结果明确排除鸡肉配方。

## 阶段 5：产品化桌宠体验

目标：让用户愿意每天打开，且桌面宠物是默认可见入口。

任务：

- 桌宠状态映射：idle、happy、hungry、tired、dirty、alert、celebrate。
- 气泡提醒：今日任务、库存不足、健康观察。
- 简单互动：点击、喂食、玩具、清洁。
- 预留社区事件：task completion、streak、challenge score。

验收：

- 用户不打开复杂面板也能从系统桌宠看到今日重点。
- 完成任务后桌宠有反馈，状态更新。

## 历史里程碑

| 周期 | 目标 | 可演示结果 |
|---|---|---|
| Week 1 | 底座串联 | opencode 调 MCP，OpenPets 显示宠物回复 |
| Week 2 | 档案和状态机 | 创建宠物档案，虚拟宠物状态随互动变化 |
| Week 3 | 今日任务 | AI 生成可解释任务清单 |
| Week 4 | 健康数据 mock | 活动/睡眠/伤口记录影响任务 |
| Week 5 | 库存推荐 | 库存不足触发商品推荐 |
| Week 6 | 打包演示 | 一个本地可运行 demo，含桌宠、AI、任务和推荐 |

## 近期下一步

1. 克隆/确认 opencode 的 MCP 接入方式。
2. 做最小 `ai-pet-mcp-server`。
3. 复用 OpenPets 控制接口打通 `virtual_pet_say/react`。
4. 把 overnight 的 OpenPets 截图 demo 升级成“读取宠物档案后发言”。
