---
title: Mochi 桌宠动作包生成计划
description: 记录照片级桌宠第一批动作、帧数、节奏和逐帧生成规则。
status: v1-complete
created: 2026-05-30
updated: 2026-05-30
update_reason: 第一批 12 个动作已生成并接入桌面运行时 manifest。
doc_type: implementation-plan
domain_taxa:
  - desktop-runtime
  - pet-avatar
  - motion-pack
related:
  - ../research/desktop-real-pet-avatar-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
---

# Mochi 桌宠动作包生成计划

## 结论

第一批不只做 10 个动作。10 个能覆盖最小闭环，但缺少“提醒”和“警觉”的分离，也缺少真实宠物的闲逛探索。当前第一批已经生成并接入 12 个核心动作。

当前运行时 manifest：`public/assets/pets/mochi/motions/manifest.json`，`version: 9`，`demoMode: motion-pack-v1-complete`。正式 walk 动作已补到 28 帧、8 fps，循环约 3.5 秒。

## 动作清单

| 优先级 | 动作 ID | 名称 | 帧数 | fps | 时长 | 类型 |
|---|---|---|---:|---:|---:|---|
| P0 | `idle` | 待机/呼吸 | 24 | 8 | 3.0s | 循环 |
| P0 | `walk` | 走路 | 28 | 8 | 3.5s | 循环 |
| P0 | `jump` | 蹦跳 | 24 | 8 | 3.0s | 单次 |
| P0 | `look_back` | 回头 | 24 | 8 | 3.0s | 单次 |
| P0 | `turn` | 转身 | 16 | 8 | 2.0s | 单次 |
| P0 | `tail_wag` | 摇尾巴 | 24 | 8 | 3.0s | 循环 |
| P0 | `sleep_laze` | 睡懒觉/趴睡 | 32 | 6 | 5.3s | 循环 |
| P0 | `remind` | 温和提醒 | 20 | 7 | 2.9s | 单次/循环 |
| P0 | `alert` | 警觉 | 20 | 8 | 2.5s | 循环 |
| P1 | `sit` | 坐下 | 20 | 7 | 2.9s | 单次 |
| P1 | `wake_stretch` | 醒来伸懒腰 | 28 | 7 | 4.0s | 单次 |
| P1 | `sniff_explore` | 嗅闻/探索 | 24 | 7 | 3.4s | 循环 |

合计：284 张透明帧。

说明：原 storyboard 规划 `turn` 为 32 帧；v1 实际可用版本先接入 16 帧。若继续提高真实感，应优先把 `turn` 补到 32 帧，再细修 `walk` 和 `sniff_explore` 的局部过渡。

## 逐帧生成规则

- 每一帧都按独立姿态生成，不允许用单张图缩放、压扁、翻转、裁四肢或 rig 变形冒充动作。
- 每帧生成后单独去背景、裁边、统一画布、统一脚底基线。
- 每帧必须保持同一只 Mochi 的身份特征：柯基、黑背、白胸白脸、棕色脸颊、大立耳、短腿、暖棕眼睛。
- 出错只重做单帧，不重做整组动作。
- `manifest.json` 只记录已经真实生成并通过验收的动作，不把未完成动作写入运行时清单。

## 生成顺序

1. `walk`：已补到正式 28 帧并降低节奏到 3.5 秒。
2. `idle`：已完成常驻呼吸/眨眼循环。
3. `tail_wag`：已完成摇尾循环。
4. `look_back`：已完成回头单次动作。
5. `turn`：已完成 16 帧 v1，后续可补 32 帧。
6. `jump`：已完成开心蹦跳。
7. `sleep_laze`：已完成休息循环。
8. `remind` 与 `alert`：已分别完成温和提醒和警觉状态。
9. `sit`、`wake_stretch`、`sniff_explore`：已补齐日常陪伴动作。

## 当前验证结果

- `python3 ai-pet/scripts/motion_pack/validate_motion_pack.py ai-pet/public/assets/pets/mochi/motions/manifest.json`：Errors: 0，Warnings: 4。
- `node --check desktop-photo-pet/runtime.js && node --check desktop-photo-pet/preload.cjs && node --check desktop-photo-pet/main.cjs`：通过。
- `npm run build`：通过。
