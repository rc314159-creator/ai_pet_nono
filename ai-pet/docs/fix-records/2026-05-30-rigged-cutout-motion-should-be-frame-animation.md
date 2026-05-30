# 局部裁剪 rig 动画不自然，应改为多帧动作序列问题记录

日期：2026-05-30

## 事实时间线

- 用户指出单张宠物 cutout 上下晃动不是真实动作。
- 随后实现了 canvas 局部 rig：把同一张 cutout 近似裁剪成头、耳、躯干、四肢等区域分别变换。
- 用户再次纠偏：这种把四肢分别固定成不同图片来控制运动展示的逻辑仍然怪异；正确逻辑应是多张图片做动画展示。
- 用户明确 Demo 先使用当前这条狗，并需要设计约 10 个运动逻辑，至少包括蹦跳、走路、回头、转身、摇尾巴。

## 证据引用

- 用户原话：“以前这个动物的运动展示有点怪异。我看到你现在是把它们的四肢分别固定成不同的图片来控制运动展示，其实不应该是这种逻辑，应该是以多张图片来做动画的逻辑来进行展示。”
- `ai-pet/desktop-photo-pet/runtime.js`：上一版 canvas 局部 rig 使用裁剪区域和 transform 组合，容易产生身体结构不自然。

## 根因

真实宠物动作需要姿态连续性。对单张照片做局部裁剪变形只能模拟轻微呼吸/眨眼，不能承担走路、转身、回头、摇尾等大动作。正确做法是每个动作使用多帧姿态图片，运行时只负责按状态机播放帧序列。

## 修复计划

1. 将桌宠动作系统从“单图局部 rig”改为“动作序列帧状态机”。
2. 当前 Demo 先为 Mochi 定义约 10 个动作：idle、jump、walk、look_back、turn、tail_wag、sit、lie_down、stretch、alert。
3. 每个动作至少预留多帧图片清单、帧率、是否循环、触发语义。
4. 当前没有完整多姿态素材时，可先用同一张源图生成临时姿态帧/占位帧，但代码结构必须按真实多帧动画来组织。
5. 后续照片上传链路应输出多动作帧包，而不是只输出单张 cutout。

## 修复结果

- 用户进一步明确：不能通过压缩、翻转、形变等物理操作生成动作帧；应逐张生成真实姿态帧或使用同一宠物的真实动画素材。
- 当前先只做走路动作，生成 20 张独立姿态透明帧用于验收。
- `ai-pet/public/assets/pets/mochi/motions/manifest.json` 记录 walk-only 动作名、帧率、循环策略、气泡文案和帧路径。
- `ai-pet/public/assets/pets/mochi/motion-sheets/walk-20-source.png` 保存走路 20 帧源 sprite sheet。
- `ai-pet/public/assets/pets/mochi/motions/walk/00.png` 到 `19.png` 保存拆出的透明帧。
- `ai-pet/desktop-photo-pet/runtime.js` 改为读取 motion manifest 并按完整帧播放，不再裁剪四肢或运行时 rig。
- `ai-pet/desktop-photo-pet/preload.cjs` 只暴露本地动作包读取桥，避免 renderer 直接启用 Node。
