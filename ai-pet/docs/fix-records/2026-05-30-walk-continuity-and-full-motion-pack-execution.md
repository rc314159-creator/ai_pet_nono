# 走路动作不连贯与完整动作包执行问题记录

日期：2026-05-30

## 事实时间线

- 当前 walk-only 预览已经从 12 fps 降到 8 fps，再降到 6 fps，20 帧循环约 3.33 秒。
- 用户反馈：走路仍然不太连贯，动作不够精细。
- 用户要求开始把动作全都做出来，并允许使用子进程/子代理并行推进。
- 用户要求动作包括蹦跳、回头、转身、摇尾巴、睡懒觉、提醒、警觉等。

## 证据引用

- 用户原话：“走路走得还是太快了，而且动作还是不太精细。”
- 用户原话：“开始做呗，把这些动作全都做出来。”
- 用户原话：“如果你能够派子进程进来的话，就让子进程进来并行的做，这些是不矛盾的。”
- `ai-pet/public/assets/pets/mochi/motions/manifest.json`：问题发生时只挂载 walk-only，20 帧、6 fps。
- `ai-pet/public/assets/pets/mochi/motions/manifest.json`：2026-05-30 已升级到 `motion-pack-v1-complete`，挂载 12 个动作、284 张透明 PNG 帧。
- `python3 ai-pet/scripts/motion_pack/validate_motion_pack.py ai-pet/public/assets/pets/mochi/motions/manifest.json`：12 个动作校验通过，Errors: 0；存在 4 个基线漂移 warning，主要来自跳跃、提醒抬爪、伸懒腰、嗅闻探索这类本身需要重心变化的动作。

## 根因

当前 walk 预览最初是从一次性生成的 20 格 sprite sheet 拆出的独立姿态帧。虽然运行时已经是逐帧播放，但生成源本身存在姿态过渡不均、体型位置不稳、局部细节跳变的问题。

修复后的 v1 动作包改为“逐动作姿态源图 + 独立透明帧 + manifest 播放”。运行时只播放完整帧序列，不对单张图做压缩、拉伸、上下晃动、肢体裁剪或骨骼 rig 变形。

## 修复计划

1. 保持运行时只消费 `manifest.json + 透明帧 PNG`，不做运行时物理变形。
2. walk 正式版从 20 帧提高到 28 帧，目标 3.5 秒循环。
3. 第一批动作从 10 个扩展为 12 个核心动作：`idle`、`walk`、`jump`、`look_back`、`turn`、`tail_wag`、`sleep_laze`、`remind`、`alert`、`sit`、`wake_stretch`、`sniff_explore`。
4. 每个动作先写 storyboard 和逐帧 prompt，再逐张生成独立姿态图。
5. 每张图单独去背景、统一 560×560 画布和脚底基线，生成预览 GIF 与 contact sheet 后验收。
6. 使用子代理并行推进 storyboard 和处理工具，主线程负责资产生成、集成和最终验收。

## 当前状态

- 已完成并接入第一批 12 个动作：`idle`、`walk`、`jump`、`look_back`、`turn`、`tail_wag`、`sleep_laze`、`remind`、`alert`、`sit`、`wake_stretch`、`sniff_explore`。
- 当前 manifest 版本：`version: 9`，`demoMode: motion-pack-v1-complete`。
- 当前总帧数：284 张透明 PNG。
- 走路动作已升级为 `walk-v2`：28 帧、8 fps、约 3.5 秒循环。
- 已补充动作处理工具：`ai-pet/scripts/motion_pack/normalize_frame.py`、`extract_pose_board.py`、`render_preview.py`、`validate_motion_pack.py`。
- 已生成各动作 contact sheet / GIF 预览，存放在 `reports/desktop-photo-pet-*`。
- `npm run build` 已通过。

## v1 已知限制

- `turn-v1` 当前是 16 帧，而不是原计划 32 帧；视角变化可用，但后续如果要更顺滑，应补到 32 帧。
- `jump`、`remind`、`wake_stretch`、`sniff_explore` 有基线漂移 warning；这些动作本身包含离地、抬爪、趴低或伸展，v1 可接受，后续需按动作类型细化校验阈值。
- `walk-v2` 已比 20 帧版本更慢更连贯，但仍属于照片级帧序列 v1，不是最终影视级动作捕捉质量。
