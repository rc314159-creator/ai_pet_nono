---
title: AI Pet 宠物外观单一真相源模块
description: 记录我的页、对话页、状态页和桌宠共享同一宠物外观状态的架构契约，明确配饰同步与服装/毛发/妆容预览边界。
status: 已批准
created: 2026-05-31
updated: 2026-05-31
update_reason: 根据用户指出“我的页、对话页、退出后的桌宠应是同一个来源和同一个动画”补齐外观状态架构。
doc_type: module-spec
domain_taxa:
  - pet-appearance
  - desktop-runtime
  - app-window
  - data-contract
related:
  - ../architecture/current-system-architecture-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../fix-records/2026-05-30-outfit-accessory-desktop-pet-sync.md
  - user-incentive-2026-05-31.md
---

# AI Pet 宠物外观单一真相源模块

## 当前结论

宠物外观不是某个页面自己的 UI 状态。当前可运行 Demo 中，“我的/装扮”页、对话页顶部宠物、状态页宠物预览和退出应用窗口后的桌面桌宠，必须读同一个 `PetAppearanceState`。

用户在“我的/装扮”页点击“保存配饰”后，外观状态必须立即成为全局事实：

- App 内所有 `MochiMotionAvatar` 都使用同一个 `accessoryId`。
- 桌宠运行时通过 `/api/desktop-pet/appearance` 读取同一个 `accessoryId`。
- App 关闭后桌宠恢复时必须强制刷新外观状态。
- API 或 App 重启后必须从持久化 store 恢复上一次保存的外观状态。

不能再出现“我的页预览有配饰、对话页无配饰、桌宠无配饰”的三套来源。

## 数据契约

`PetAppearanceState` 当前字段：

- `petId`：宠物 ID，当前 Demo 为 `pet_mochi`。
- `accessoryId`：真实同步的桌宠配饰 ID，取值为 `none`、`acc-gps`、`acc-bell`、`acc-medal`。
- `accessoryLabel`：用户可读配饰名。
- `syncTarget`：当前为 `desktop_pet`。
- `assetMode`：运行时内部字段，`image_edit_generated_full_frame` 表示可使用完整配饰帧；`image_edit_required` 表示没有可用完整帧。
- `source`：状态来源，当前为 `app_window`。
- `updatedAt`：外观状态更新时间。
- `note`：用户可见短提示，只能写“已换上定位徽章。”这类结果，不能暴露完整生图帧、回退策略等工程说明。

Demo 阶段持久化路径：

- 默认：`.ai-pet-data/appearance.json`。
- 可通过 `AI_PET_APPEARANCE_FILE` 覆盖。
- 打包运行时跟随 `AI_PET_DATA_DIR` 写入用户数据目录。

## 真实同步边界

当前真实同步只支持配饰。

- `none`：无配饰，所有端显示原始 Mochi 动作帧。
- `acc-gps`：定位徽章。
- `acc-bell`：提醒铃铛。
- `acc-medal`：巡逻奖章。

服装、毛发、妆容如果没有为每个动作帧生成完整图片资产，只能作为应用窗口预览或后续方案，不能写入 `PetAppearanceState`，也不能在 UI 中表达为已同步到桌宠、对话页或所有端。

如果后续要把服装、毛发、妆容也纳入同步，必须先扩展数据契约，并为每个外观维度生成与 Mochi motion manifest 对齐的完整动作帧资产。

## 渲染契约

所有 App 内宠物形象都必须通过 `MochiMotionAvatar` 或等价的同源动画组件渲染。

最低要求：

- “我的/装扮”页预览：使用当前草稿配饰 `draftAccessory`，用于保存前预览。
- “我的”页已保存状态、对话页、欢迎页、状态页：使用全局 `PetAppearanceState.accessoryId`。
- `PetFigure` 不能吞掉 `accessory`，必须继续传给 `MochiMotionAvatar.accessoryId`。
- 桌宠运行时不能运行时贴图合成配饰，只能按 `image-edited-outfits/<accessory>/<framePath>` 读取完整配饰帧；没有对应帧时允许回退原始帧。

## 写入与读取流程

保存配饰：

1. 用户在“我的/装扮”页选择配饰。
2. 点击“保存配饰”。
3. 应用窗口 POST `/api/desktop-pet/appearance`，body 包含 `petId` 和 `accessoryId`。
4. `server/appearance.ts` 校验配饰 ID，计算资产可用性，写入 `.ai-pet-data/appearance.json`。
5. API 返回新的 `PetAppearanceState`。
6. 应用窗口用返回状态更新全局外观状态。
7. 所有 App 内宠物形象随 React state 重新渲染。
8. 桌宠轮询或应用窗口关闭通知触发 `pollAppearance({ force: true })`，读取同一状态并重绘当前帧。

进入 App：

1. 应用窗口启动时 GET `/api/desktop-pet/appearance`。
2. 如果返回合法配饰，根组件设置全局 `accessory`。
3. 欢迎页、对话页、状态页和我的页全部读这个根状态。

退出 App：

1. 应用窗口关闭。
2. `desktop/photo-pet/main.cjs` 恢复桌宠窗口并发送 `desktop-photo-pet:app-window-closed`。
3. `desktop/photo-pet/runtime.js` 同时强制拉取最新对话气泡和最新外观状态。
4. 桌宠按当前 `PetAppearanceState` 立即重绘。

## 验收标准

- 保存 `acc-gps` 后，`GET /api/desktop-pet/appearance` 返回 `accessoryId: "acc-gps"`。
- “我的/装扮”页预览有定位徽章。
- 切到对话页后，顶部动态宠物也有定位徽章。
- 关闭应用窗口后，桌面桌宠恢复且同样显示定位徽章。
- 重启 API 后，`GET /api/desktop-pet/appearance` 仍恢复上一次保存的配饰。
- 保存 `none` 后，所有端恢复无配饰。
- 服装、毛发、妆容只显示预览/保留预览，不写入外观同步状态。
