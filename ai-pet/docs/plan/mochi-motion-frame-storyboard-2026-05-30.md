---
title: Mochi 桌宠第一批 12 动作逐帧 Storyboard 与生成 Prompt 规范
description: 约束 Mochi 桌宠动作资产必须逐帧生成真实独立姿态图，并给出 12 个动作的帧数、节奏、关键帧、逐帧姿态指令、prompt 模板和验收标准。
status: v1-executed
created: 2026-05-30
updated: 2026-05-30
doc_type: motion-storyboard
domain_taxa:
  - desktop-runtime
  - pet-avatar
  - motion-pack
related:
  - desktop-pet-motion-pack-plan-2026-05-30.md
  - ../architecture/technical-architecture-2026-05-30.md
  - ../research/desktop-real-pet-avatar-2026-05-30.md
---

# Mochi 桌宠第一批 12 动作逐帧 Storyboard 与生成 Prompt 规范

## 目标

为 Mochi 桌宠第一批动作包提供可直接执行的逐帧生产规范。每一帧都必须是独立生成的真实姿态图，不能用单张照片压缩、拉伸、翻转、上下移动、裁四肢、骨骼 rig 或局部变形来冒充动作。

第一批动作规划共 12 个，目标 300 张透明帧。2026-05-30 已执行 v1：12 个动作全部接入，实际 284 张透明帧；差异来自 `turn-v1` 先接入 16 帧可用版本，后续可补到本 storyboard 规划的 32 帧。

| 动作 ID | 名称 | 帧数 | fps | 时长 | 类型 |
|---|---|---:|---:|---:|---|
| `idle` | 待机/呼吸 | 24 | 8 | 3.00s | 循环 |
| `walk` | 走路 | 28 | 8 | 3.50s | 循环 |
| `jump` | 蹦跳 | 24 | 8 | 3.00s | 单次 |
| `look_back` | 回头 | 24 | 8 | 3.00s | 单次 |
| `turn` | 转身 | 32 | 8 | 4.00s | 单次 |
| `tail_wag` | 摇尾巴 | 24 | 8 | 3.00s | 循环 |
| `sleep_laze` | 睡懒觉/趴睡 | 32 | 6 | 5.33s | 循环 |
| `remind` | 温和提醒 | 20 | 7 | 2.86s | 单次/可循环 |
| `alert` | 警觉 | 20 | 8 | 2.50s | 循环 |
| `sit` | 坐下 | 20 | 7 | 2.86s | 单次 |
| `wake_stretch` | 醒来伸懒腰 | 28 | 7 | 4.00s | 单次 |
| `sniff_explore` | 嗅闻/探索 | 24 | 7 | 3.43s | 循环 |

## 通用生成规则

### 统一身份

所有帧必须锁定同一只狗：

- Mochi：照片级真实柯基，黑背、白脸、白胸、棕色脸颊和眉点，大立耳，短腿，圆润身体，暖棕眼睛，友好但不夸张。
- 不能换品种、不能变成长腿犬、不能变卡通、不能变 3D 玩具、不能增加衣服、项圈、道具或背景元素。
- 允许动作造成耳朵、毛发、尾巴、爪子姿态变化，但毛色分布、脸型、眼神、体型比例必须稳定。

### 统一画面

- 输出透明背景 PNG；如果生成模型不能稳定直接透明，先用纯色抠图背景生成，再单帧抠图。
- 推荐源画布为正方形，最终归一到同一尺寸、同一脚底基线、同一视觉中心。
- 全身必须完整可见，四爪、耳朵、尾巴不能被裁切。
- 除 `jump` 的腾空帧外，至少一只脚或身体接触同一地面基线。
- 循环动作首尾帧要能无缝衔接；单次动作要有明确起势、动作峰值和收势。

### 通用 Prompt 模板

每帧生成时使用同一张 Mochi 参考图，并把下表中的逐帧姿态指令填入 `{FRAME_POSE}`。

```text
Use the provided reference image of Mochi as the identity reference.
Create one single animation frame of the same real corgi dog.

Identity:
Mochi is a photorealistic Pembroke corgi, black saddle back, white face and chest, warm tan cheeks and eyebrows, large upright ears, short legs, compact body, warm brown eyes, natural fluffy fur. Keep the same markings, proportions, muzzle shape, ear shape, eye color, and body size as the reference.

Frame requirements:
Action: {ACTION_ID} / {ACTION_NAME}
Frame: {FRAME_INDEX} of {FRAME_COUNT}
Pose directive: {FRAME_POSE}
Camera: full-body desktop pet sprite, stable 3/4 side view unless the pose explicitly turns, eye-level slightly above the dog, natural studio lighting.
Output: transparent background PNG, full body visible, clean alpha edge, no floor, no shadow baked into the body, no text.
Continuity: keep the dog centered on the same canvas, keep the paws aligned to the shared ground baseline unless the frame is airborne.

Negative prompt:
cartoon, anime, toy, plush, low-poly 3D, statue, duplicate dog, extra legs, missing legs, deformed paws, human hands, leash, collar, clothing, accessories, background scene, floor, furniture, text, watermark, cropped ears, cropped paws, distorted face, changed coat pattern, different dog, mirrored markings unless the storyboard says the dog has genuinely turned.
```

### 单帧验收闸

每张帧图入库前都要通过以下检查：

- 身份一致：Mochi 的毛色分区、脸型、耳朵、体型没有漂移。
- 姿态正确：该帧明确表达 storyboard 中的姿态，而不是上一帧的轻微拉伸。
- 透明正确：背景干净，边缘无色块、残影、文字、水印。
- 画布一致：狗的视觉中心、脚底基线和尺寸与同动作其他帧一致。
- 动画连续：前后两帧过渡合理，没有瞬移、缺肢、毛色突变或方向跳变。

## 动作 1: `idle` 待机/呼吸

| 项 | 值 |
|---|---|
| 帧数 | 24 |
| fps | 8 |
| 时长 | 3.00s |
| 类型 | 循环 |

动作弧线：站立待机，从自然站姿进入轻微吸气、眨眼、耳朵微动，再回到自然站姿。动作必须克制，像真实宠物安静陪伴，不做明显弹跳。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 自然站姿，头略偏向用户，眼神放松 |
| 06 | 吸气峰值，胸腔自然饱满，耳朵微微前倾 |
| 10 | 眼睛开始眨，嘴巴闭合，身体仍稳定 |
| 12 | 眨眼最低点，眼皮半闭或接近闭合 |
| 18 | 呼气阶段，肩颈放松，尾巴自然下垂 |
| 23 | 回到 00 的自然站姿，首尾可循环 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Neutral standing idle pose, relaxed eyes, head slightly angled toward the viewer, all paws on baseline. |
| 01 | Same standing pose, chest just begins a natural inhale, ears steady. |
| 02 | Gentle inhale continues, ribcage subtly fuller, weight still evenly balanced. |
| 03 | Head lifts a few degrees with calm attention, mouth closed. |
| 04 | Ears lean forward slightly as if listening, body remains still. |
| 05 | Inhale almost at peak, shoulders naturally open, tail relaxed. |
| 06 | Peak inhale, chest naturally full, eyes soft and alert. |
| 07 | Holding the breath for a moment, very small ear twitch on one ear. |
| 08 | Exhale begins, head eases back toward neutral. |
| 09 | Eyelids start lowering for a slow blink, posture stable. |
| 10 | Half blink, eyelids halfway down, ears relaxed. |
| 11 | Blink deepens, face still clearly Mochi, body unchanged. |
| 12 | Blink at lowest point, eyes nearly closed, peaceful expression. |
| 13 | Eyes reopen slightly, exhale continues. |
| 14 | Eyes half open, head returns to neutral angle. |
| 15 | Eyes fully open, chest naturally smaller after exhale. |
| 16 | Tiny weight shift to front paws without moving baseline. |
| 17 | Tail gives a barely visible relaxed twitch, not a wag. |
| 18 | Calm exhale finish, shoulders relaxed. |
| 19 | Ears return to normal upright position. |
| 20 | Neutral gaze, breathing settles. |
| 21 | Body posture matches frame 02 in reverse, ready to loop. |
| 22 | Almost identical to neutral, no visible bounce. |
| 23 | Match frame 00 as closely as possible for a seamless loop. |

### Prompt 附加约束

`{ACTION_ID}` 填 `idle`，`{ACTION_NAME}` 填 `calm breathing idle`。必须强调 `subtle real breathing pose, no body scaling, no bouncing, no stylized animation smear`。

### 验收标准

- 24 帧播放时只看到真实呼吸和眨眼，不像图片整体缩放。
- 00 和 23 可无缝循环。
- 眨眼帧不能改变脸型或毛色。
- 不允许出现脚底上下漂移。

## 动作 2: `walk` 走路

| 项 | 值 |
|---|---|
| 帧数 | 28 |
| fps | 8 |
| 时长 | 3.50s |
| 类型 | 循环 |

动作弧线：Mochi 以慢速、真实、轻松的步伐原地向右行走。使用完整身体姿态逐帧生成，表现前后腿交替、肩胛和臀部自然起伏、头部稳定跟随。不能靠移动整张图或压缩身体实现。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 右向 3/4 侧身，左前腿向前触地，右后腿向后蹬地 |
| 04 | 身体通过支撑腿上方，头部稳定，背线平顺 |
| 07 | 右前腿开始前摆，左后腿跟进，四肢交替清晰 |
| 11 | 右前腿向前触地，左后腿向后蹬地 |
| 14 | 中间过渡，身体重心居中，步幅慢 |
| 18 | 左前腿再次前摆，右后腿跟进 |
| 21 | 左前腿向前触地，右后腿向后蹬地 |
| 27 | 回到接近 00 的相位，首尾可循环 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Slow in-place walk to the right, left front paw forward touching baseline, right rear leg extended back, head calm. |
| 01 | Left front paw takes weight, right rear paw begins to lift from the push-off, body slightly over front support. |
| 02 | Right rear leg swings forward under the body, left front still planted, right front begins to unload. |
| 03 | Passing pose, right rear paw under hip, right front paw just lifting, back line natural. |
| 04 | Body centered over support legs, head level, left rear paw prepares to push. |
| 05 | Right front paw swings forward low above baseline, left rear paw pushes back. |
| 06 | Right front paw reaches forward, toes extended naturally, left rear leg trailing. |
| 07 | Right front paw nearly touches baseline, left rear paw still last contact, ears steady. |
| 08 | Right front paw touches down, weight begins transferring forward. |
| 09 | Right front takes weight, left front paw begins to lift and fold back naturally. |
| 10 | Left front paw lifts clear, left rear leg starts moving forward under body. |
| 11 | Right front planted forward, left rear paw under body, right rear leg relaxed. |
| 12 | Body passes over right front support, head dips very slightly from real gait. |
| 13 | Left rear paw steps forward, left front continues rearward swing. |
| 14 | Mid-cycle pose, front legs crossing naturally without tangling, all proportions stable. |
| 15 | Left rear paw touches down forward, right rear prepares to push. |
| 16 | Left front paw begins forward swing, right front starts unloading. |
| 17 | Left front paw swings forward low, right rear paw pushes back. |
| 18 | Left front reaches forward, head stays relaxed, tail follows body rhythm. |
| 19 | Left front paw nearly touches baseline, right rear extended behind. |
| 20 | Left front paw touches down, weight begins transferring. |
| 21 | Left front planted forward, right rear leg extended back, close to the opening contact pose. |
| 22 | Body moves over left front support, right rear starts lifting forward. |
| 23 | Right rear leg passes under the body, right front prepares next step. |
| 24 | Passing pose, shoulders and hips show real walking offset, no body stretch. |
| 25 | Right front paw begins reaching forward again, left rear pushes gently. |
| 26 | Right front paw forward, left front starting to unload, close to frame 06 phase. |
| 27 | Return to the same gait phase as frame 00, ready for a seamless loop. |

### Prompt 附加约束

`{ACTION_ID}` 填 `walk`，`{ACTION_NAME}` 填 `slow realistic in-place walk cycle`。每帧都加：`anatomically plausible corgi walking gait, short legs, slow desktop pet pace, no motion blur, no stretched body, no duplicated paws`。

### 验收标准

- 28 帧播放时一圈约 3.5 秒，节奏慢且连贯。
- 每一步能看出前后腿交替，不是整张图左右晃或身体压缩。
- 00 和 27 循环无跳变。
- 不允许某帧突然多腿、断腿、腿长突变或身体方向突然改变。

## 动作 3: `jump` 蹦跳

| 项 | 值 |
|---|---|
| 帧数 | 24 |
| fps | 8 |
| 时长 | 3.00s |
| 类型 | 单次 |

动作弧线：开心但真实的小跳。先下蹲蓄力，再四爪离地，达到腾空峰值，随后自然落地、弯腿吸收冲击，最后回到站姿。不能把图片整体上下移动当作跳跃。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 自然站姿，准备动作 |
| 04 | 下蹲蓄力，前后腿都弯曲，耳朵略后 |
| 08 | 离地瞬间，四爪刚离开地面 |
| 11 | 腾空峰值，腿自然收起，表情开心 |
| 15 | 下降，前爪准备落地 |
| 18 | 落地，四肢弯曲吸收 |
| 23 | 恢复站姿 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Neutral standing pose before a small happy jump, all paws on baseline. |
| 01 | Attention rises, head lifts slightly, front paws still planted. |
| 02 | Knees and elbows begin to bend naturally, body lowers into anticipation. |
| 03 | Deeper crouch, hind legs coiling for a jump, ears slightly back. |
| 04 | Lowest crouch, compact body, eyes bright, all paws still on baseline. |
| 05 | Launch begins, hind legs push, front paws start lifting. |
| 06 | Front paws off baseline, rear paws still pushing, body angled upward. |
| 07 | Rear paws leave baseline, all four paws airborne, body rising. |
| 08 | Clear takeoff, legs tucked slightly, happy focused expression. |
| 09 | Rising higher, front paws softly bent, ears lifted by motion. |
| 10 | Near peak, body floating, legs naturally gathered. |
| 11 | Peak of small jump, all paws airborne, balanced compact corgi shape. |
| 12 | Tiny hang time after peak, head forward, tail/haunches natural. |
| 13 | Descent begins, front paws extend toward baseline. |
| 14 | Front paws reaching down, hind legs still tucked. |
| 15 | Front paws close to baseline, body descending, eyes alert. |
| 16 | Front paws lightly touch baseline, rear paws still airborne. |
| 17 | Rear paws come down, elbows and knees bend to absorb landing. |
| 18 | Full landing, all paws on baseline, legs bent, body low. |
| 19 | Recovery begins, body rises from landing crouch. |
| 20 | Legs straighten, head returns to normal height. |
| 21 | Small happy settle, ears upright again. |
| 22 | Nearly neutral standing pose, breathing calm. |
| 23 | Return to neutral standing pose matching idle entry. |

### Prompt 附加约束

`{ACTION_ID}` 填 `jump`，`{ACTION_NAME}` 填 `small happy realistic jump`。腾空帧必须写 `all paws airborne, no ground shadow, transparent background`；落地帧必须写 `bent legs absorbing impact, paws on shared baseline`。

### 验收标准

- 能清楚看到蓄力、离地、腾空、落地和恢复。
- 腾空帧是真实跳跃姿态，不是同一站姿被抬高。
- 落地时腿部姿态变化可信，不出现身体被压扁的图像变形感。
- 单次播放后可自然回到 `idle`。

## 动作 4: `look_back` 回头

| 项 | 值 |
|---|---|
| 帧数 | 24 |
| fps | 8 |
| 时长 | 3.00s |
| 类型 | 单次 |

动作弧线：身体基本保持站立朝右，先听到身后动静，耳朵转向，随后头颈和肩部轻微带动，回头看向身后，停顿后再转回正面。重点是真实头颈旋转，不是把头像贴片旋转。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 右向站姿，眼神向前 |
| 04 | 耳朵先转向身后，头轻微偏转 |
| 08 | 头转到 45 度，肩部有轻微跟随 |
| 12 | 完整回头，看向左后方/身后 |
| 16 | 保持回头，表情好奇 |
| 20 | 头颈转回 |
| 23 | 回到自然站姿 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Standing facing right in 3/4 side view, relaxed forward gaze. |
| 01 | One ear begins to rotate backward as if hearing something. |
| 02 | Both ears attend backward, head still mostly forward. |
| 03 | Nose begins turning back a few degrees, eyes glance behind. |
| 04 | Head turns slightly backward, neck twist starts naturally. |
| 05 | Head turns farther back, shoulder line follows a little. |
| 06 | Nose points diagonally back, eyes visible in a side glance. |
| 07 | Neck twist increases, body remains planted and stable. |
| 08 | Head about halfway turned back, ears aimed behind. |
| 09 | Head turns over shoulder, cheek and muzzle angle clearly changed. |
| 10 | Head nearly looking behind, front paws still fixed on baseline. |
| 11 | Full over-the-shoulder look begins, curious expression. |
| 12 | Full look back, face visible looking toward rear-left, ears upright. |
| 13 | Hold full look back, eyes focused on something behind. |
| 14 | Hold with tiny ear twitch, same over-shoulder posture. |
| 15 | Hold with slightly softer expression, body still stable. |
| 16 | Final hold of the backward look, no body rotation beyond shoulders. |
| 17 | Head starts turning forward again, ears follow. |
| 18 | Head halfway returning, eyes shift forward. |
| 19 | Nose points diagonally forward, shoulder twist relaxes. |
| 20 | Head almost forward, ears returning upright. |
| 21 | Forward gaze restored, body posture neutral. |
| 22 | Calm standing pose, tiny settling movement. |
| 23 | Match frame 00 neutral standing pose. |

### Prompt 附加约束

`{ACTION_ID}` 填 `look_back`，`{ACTION_NAME}` 填 `realistic over-the-shoulder look back`。每帧都加：`natural neck rotation, same full body, paws stay planted, no detached head, no pasted head`。

### 验收标准

- 回头过程由耳朵、眼神、头颈、肩部依次带动。
- 身体不能整只反向翻转。
- 头部不能像贴图一样硬旋转，颈部连接必须自然。
- 末帧能回到原站姿。

## 动作 5: `turn` 转身

| 项 | 值 |
|---|---|
| 帧数 | 32 |
| fps | 8 |
| 时长 | 4.00s |
| 类型 | 单次 |

动作弧线：Mochi 从朝右站姿真实转身到朝左站姿。需要生成连续视角变化：右侧 3/4、正面、左侧 3/4。禁止直接水平翻转，因为真实转身时毛色分布、胸部、四肢遮挡和头身透视都会变化。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 朝右 3/4 站姿 |
| 06 | 前爪开始小步换位，身体向正面转 |
| 10 | 接近正面，胸口和双耳对称可见 |
| 16 | 正面到左向过渡，后腿换位 |
| 22 | 朝左 3/4 基本完成 |
| 28 | 调整脚步站稳 |
| 31 | 朝左稳定站姿 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Standing facing right in 3/4 side view, all paws on baseline. |
| 01 | Head begins to turn toward the viewer, right-facing body still mostly unchanged. |
| 02 | Shoulders begin rotating toward front, front paws prepare to step. |
| 03 | Left front paw lifts slightly to pivot, chest starts opening toward viewer. |
| 04 | Front body turns more frontal, head looks near front, rear paws planted. |
| 05 | First small pivot step lands, body now halfway between right side and front. |
| 06 | Shoulders continue rotating, both ears more symmetrical, chest more visible. |
| 07 | Rear paws begin to reposition, hips follow the shoulders. |
| 08 | Near front 3/4 view, face turns toward viewer, paws staggered naturally. |
| 09 | Front view increases, white chest centered, both front paws visible. |
| 10 | Almost full front view, ears upright and symmetrical, short legs visible. |
| 11 | Full front-facing pivot moment, head calm, body compact. |
| 12 | Head starts turning toward left, left shoulder begins leading. |
| 13 | Front paws step to continue turn, body rotates past front view. |
| 14 | Left-facing 3/4 begins, right side starts receding. |
| 15 | Rear paws cross-step naturally, hips rotate left. |
| 16 | Body halfway from front to left, muzzle points left-front. |
| 17 | Left-facing angle clearer, chest still partially visible. |
| 18 | Front paw sets down on new left-facing stance, rear paw lifts. |
| 19 | Hips align with shoulders, tail/hindquarters follow the turn. |
| 20 | Mostly left-facing 3/4 view, paws still adjusting. |
| 21 | Head points left, ears stable, body nearly settled. |
| 22 | Left-facing stance established, all paws on baseline. |
| 23 | Small adjustment step with rear paw to balance. |
| 24 | Body weight shifts evenly over all four paws. |
| 25 | Head gives a tiny settling motion, expression relaxed. |
| 26 | Left-facing 3/4 pose, chest angle stable. |
| 27 | Final foot placement, no sliding. |
| 28 | Fully settled left-facing stance, all paws grounded. |
| 29 | Calm hold, breathing normal. |
| 30 | Stable left-facing pose, ready for next action. |
| 31 | Final left-facing neutral standing pose. |

### Prompt 附加约束

`{ACTION_ID}` 填 `turn`，`{ACTION_NAME}` 填 `realistic full-body turn from right-facing to left-facing`。必须加：`do not mirror the previous frame; generate a real new camera angle of the same dog, with correct perspective and natural paw repositioning`。

### 验收标准

- 能看出从右侧到正面再到左侧的真实视角变化。
- 不允许出现左右直接翻转导致毛色和脸部不可信。
- 脚步换位必须合理，不允许四脚滑动。
- 末帧可作为后续朝左动作的起始姿态。

## 动作 6: `tail_wag` 摇尾巴

| 项 | 值 |
|---|---|
| 帧数 | 24 |
| fps | 8 |
| 时长 | 3.00s |
| 类型 | 循环 |

动作弧线：开心站姿，尾巴左右轻快摆动，臀部和背线有非常轻微的自然联动，头部表情开心但不夸张。柯基尾巴短，不能生成大型长尾犬尾巴。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 开心站姿，短尾居中 |
| 04 | 尾巴摆向左侧，臀部轻微跟随 |
| 08 | 尾巴回中，嘴角微开 |
| 12 | 尾巴摆向右侧，身体保持稳定 |
| 16 | 尾巴回中，耳朵轻快 |
| 20 | 第二次左/右摆动进入循环 |
| 23 | 回到 00 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Happy standing pose, short fluffy corgi tail centered, relaxed smile. |
| 01 | Tail starts moving left, hips barely follow, paws planted. |
| 02 | Tail farther left, eyes bright, ears upright. |
| 03 | Tail near left extreme, rear fur naturally displaced. |
| 04 | Tail at left extreme, tiny happy mouth opening. |
| 05 | Tail returns from left, hips recenter. |
| 06 | Tail halfway to center, head steady. |
| 07 | Tail close to center, expression cheerful. |
| 08 | Tail centered, body balanced, slight open-mouth smile. |
| 09 | Tail starts moving right, hindquarters subtly follow. |
| 10 | Tail farther right, ears still upright. |
| 11 | Tail near right extreme, paws do not move. |
| 12 | Tail at right extreme, compact corgi body stable. |
| 13 | Tail returns from right, hips recenter. |
| 14 | Tail halfway to center, happy eyes. |
| 15 | Tail close to center, mouth relaxed. |
| 16 | Tail centered, brief cheerful hold. |
| 17 | Tail moves left again, smaller amplitude than first swing. |
| 18 | Tail reaches left mid-point, body calm. |
| 19 | Tail returns center, tiny ear bounce pose. |
| 20 | Tail moves right again, natural short-tail motion. |
| 21 | Tail reaches right mid-point, paws planted. |
| 22 | Tail returns center, expression steady. |
| 23 | Match frame 00 happy standing pose for loop. |

### Prompt 附加约束

`{ACTION_ID}` 填 `tail_wag`，`{ACTION_NAME}` 填 `happy realistic short corgi tail wag`。每帧加：`short corgi tail, subtle hip follow-through, no long tail, no body bouncing`。

### 验收标准

- 主要运动是尾巴真实摆动，身体只轻微联动。
- 尾巴长度和形状符合 Mochi，不突然变成长尾。
- 脚底不漂移，头身不变形。
- 00 和 23 循环自然。

## 动作 7: `sleep_laze` 睡懒觉/趴睡

| 项 | 值 |
|---|---|
| 帧数 | 32 |
| fps | 6 |
| 时长 | 5.33s |
| 类型 | 循环 |

动作弧线：Mochi 趴睡或侧趴，缓慢呼吸，偶尔耳朵或爪子轻微抽动。动作要非常慢，适合桌面陪伴场景的休息状态。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 趴睡姿态，头枕在前爪附近 |
| 08 | 呼吸吸气峰值，身体自然起伏 |
| 12 | 耳朵轻微 twitch |
| 16 | 睡得更沉，眼睛闭合 |
| 22 | 一只前爪轻微伸出或收回 |
| 28 | 呼气结束，身体回落 |
| 31 | 回到 00 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Lying down sleepy corgi pose, head resting near front paws, eyes closed, body on baseline. |
| 01 | Slow sleeping inhale begins, ribcage subtly fuller, eyes closed. |
| 02 | Breathing continues, muzzle relaxed, ears soft. |
| 03 | Body gently fuller from inhale, no scaling artifact. |
| 04 | Peaceful sleep, front paws tucked naturally. |
| 05 | Inhale continues, side fur naturally lifted by breathing pose. |
| 06 | Near inhale peak, head still resting. |
| 07 | Peak sleepy inhale, body relaxed. |
| 08 | Hold inhale peak, ears remain soft. |
| 09 | Exhale begins, body naturally settles. |
| 10 | One ear gives a tiny sleepy twitch. |
| 11 | Ear twitch continues, head still down. |
| 12 | Ear returns toward relaxed position. |
| 13 | Exhale continues, eyes fully closed. |
| 14 | Sleep deepens, shoulders relaxed. |
| 15 | Body almost at resting size, paws unchanged. |
| 16 | Deep sleep hold, calm closed eyes. |
| 17 | Tiny nose movement as if dreaming. |
| 18 | Front paw begins a small sleepy flex. |
| 19 | Front paw flexes slightly outward, not a stretch. |
| 20 | Paw relaxes halfway back. |
| 21 | Paw nearly returns to tucked position. |
| 22 | Paw fully relaxed, body starts next slow inhale. |
| 23 | Gentle inhale again, head remains on paws. |
| 24 | Breathing grows slightly fuller. |
| 25 | Very small shoulder rise from inhale. |
| 26 | Calm sleeping face, ears steady. |
| 27 | Exhale starts to settle. |
| 28 | Body settles back down. |
| 29 | Pose close to initial sleeping frame. |
| 30 | Breathing neutral, all features stable. |
| 31 | Match frame 00 for a seamless lazy sleep loop. |

### Prompt 附加约束

`{ACTION_ID}` 填 `sleep_laze`，`{ACTION_NAME}` 填 `slow lazy sleeping corgi breathing loop`。每帧加：`lying down full body, eyes closed, very slow sleepy breathing, no bouncing, no standing pose`。

### 验收标准

- 播放节奏慢，像真实睡眠呼吸，不像图片缩放。
- 耳朵和爪子 twitch 只出现少数帧，不能打断休息状态。
- 00 和 31 循环自然。
- 睡姿轮廓、头爪接触关系稳定。

## 动作 8: `remind` 温和提醒

| 项 | 值 |
|---|---|
| 帧数 | 20 |
| fps | 7 |
| 时长 | 2.86s |
| 类型 | 单次/可循环 |

动作弧线：Mochi 用温和方式提醒用户：看向用户、轻轻抬起一只前爪、张嘴像轻叫一声，然后放下爪子回到稳定姿态。它应该像提醒，不像警报。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 自然站姿，看向用户 |
| 04 | 身体轻微前倾，注意力集中 |
| 08 | 前爪抬起，眼神期待 |
| 11 | 嘴微张，像轻叫提醒 |
| 15 | 前爪落回，表情柔和 |
| 19 | 回到稳定姿态 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Calm standing pose facing the user in 3/4 view, gentle attention. |
| 01 | Eyes focus more directly on viewer, ears perk softly. |
| 02 | Head tilts slightly, body remains friendly and non-alarming. |
| 03 | Weight shifts subtly to rear and one front paw prepares to lift. |
| 04 | Body leans forward a little as if asking for attention. |
| 05 | One front paw begins lifting from baseline. |
| 06 | Front paw lifted halfway, elbow bent naturally. |
| 07 | Paw rises higher, eyes warm and expectant. |
| 08 | Paw fully raised in a gentle reminder gesture. |
| 09 | Hold paw raised, ears attentive, mouth still closed. |
| 10 | Mouth begins to open slightly for a soft bark. |
| 11 | Small open-mouth reminder expression, paw still raised. |
| 12 | Mouth closing, paw begins lowering. |
| 13 | Paw halfway down, expression soft. |
| 14 | Paw nearly touches baseline, head still looking at user. |
| 15 | Paw touches baseline gently, body recovers. |
| 16 | Weight returns evenly to all paws. |
| 17 | Head tilt softens back to neutral. |
| 18 | Calm standing pose, reminder completed. |
| 19 | Stable final pose that can return to idle. |

### Prompt 附加约束

`{ACTION_ID}` 填 `remind`，`{ACTION_NAME}` 填 `gentle reminder paw raise`。每帧加：`friendly reminder, soft expression, not alarmed, one natural raised front paw when specified`。

### 验收标准

- 抬爪、轻叫、放下爪子的动作链清楚。
- 表情温和，不像惊吓或攻击。
- 前爪不能变形或多出爪子。
- 可单次播放，也可在 00/19 附近短循环等待用户响应。

## 动作 9: `alert` 警觉

| 项 | 值 |
|---|---|
| 帧数 | 20 |
| fps | 8 |
| 时长 | 2.50s |
| 类型 | 循环 |

动作弧线：Mochi 警觉但不恐慌。耳朵竖起，身体重心略向前，头部左右扫描，再回到正前方。适合异常提醒前的状态表达。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 站姿，耳朵竖起，眼神集中 |
| 04 | 头向左扫描 |
| 08 | 回中，身体前倾 |
| 12 | 头向右扫描 |
| 16 | 回中，保持警觉 |
| 19 | 回到 00 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Alert standing pose, ears high, eyes focused, body slightly forward. |
| 01 | Ears perk even more, head lifts a little. |
| 02 | Head begins scanning left, eyes sharp. |
| 03 | Head turns farther left, neck natural. |
| 04 | Full left scan, ears aimed left, paws planted. |
| 05 | Hold left alert scan, body still forward. |
| 06 | Head starts returning center. |
| 07 | Head halfway center, eyes still alert. |
| 08 | Center alert pose, weight forward, ears high. |
| 09 | Tiny freeze as if listening, mouth closed. |
| 10 | Head begins scanning right. |
| 11 | Head turns farther right, ears follow. |
| 12 | Full right scan, eyes focused. |
| 13 | Hold right alert scan, body tense but not scared. |
| 14 | Head returns toward center. |
| 15 | Head halfway center, posture steady. |
| 16 | Center alert pose again, ears upright. |
| 17 | Small settling breath, still alert. |
| 18 | Eyes glance forward, ready to loop. |
| 19 | Match frame 00 alert standing pose. |

### Prompt 附加约束

`{ACTION_ID}` 填 `alert`，`{ACTION_NAME}` 填 `calm alert scanning loop`。每帧加：`alert but not aggressive, ears high, focused eyes, no barking, no panic`。

### 验收标准

- 与 `remind` 区分清楚：`alert` 更紧张、更专注，但不抬爪卖萌。
- 头部扫描自然，颈部连接正确。
- 00 和 19 可循环。
- 不出现张牙、攻击姿态或恐惧缩成一团。

## 动作 10: `sit` 坐下

| 项 | 值 |
|---|---|
| 帧数 | 20 |
| fps | 7 |
| 时长 | 2.86s |
| 类型 | 单次 |

动作弧线：从站立自然坐下。前爪基本保持位置，后腿弯曲，臀部下落到坐姿，最后坐稳抬头看用户。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 站姿 |
| 05 | 后腿开始弯曲，臀部后移 |
| 10 | 半坐姿，前爪稳定 |
| 15 | 臀部接近地面，背线自然 |
| 19 | 坐稳 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Neutral standing pose, facing slightly toward viewer. |
| 01 | Attention shifts to user, preparing to sit. |
| 02 | Hind legs begin bending, front paws stay planted. |
| 03 | Hips move slightly backward, knees flex naturally. |
| 04 | Body lowers a little, back remains natural. |
| 05 | Hind legs bend more, rear lowering toward baseline. |
| 06 | Front paws remain stable, chest stays upright. |
| 07 | Hips descend, rear paws adjust slightly. |
| 08 | Halfway sitting pose, short legs visible. |
| 09 | Body lowers farther, head still up. |
| 10 | Clear half-sit, front paws straight, hindquarters low. |
| 11 | Rear approaches seated position, tail/hind fur natural. |
| 12 | Knees tucked, chest vertical. |
| 13 | Rear nearly touching baseline, front paws aligned. |
| 14 | Transition into seated pose, body compact. |
| 15 | Seated contact begins, hind legs folded. |
| 16 | Sitting pose stabilizes, head lifts. |
| 17 | Full seated pose, eyes warm. |
| 18 | Small settling motion in seated position. |
| 19 | Stable final seated pose, ready for idle sitting or next action. |

### Prompt 附加约束

`{ACTION_ID}` 填 `sit`，`{ACTION_NAME}` 填 `realistic stand to sit transition`。每帧加：`front paws stay mostly planted, hind legs bend naturally, no body squash`。

### 验收标准

- 能看清从站到坐的重心变化。
- 前爪不滑动，后腿弯曲可信。
- 坐姿要稳定，不像趴下或蹲跳。
- 末帧可作为后续静态坐姿或提醒动作起点。

## 动作 11: `wake_stretch` 醒来伸懒腰

| 项 | 值 |
|---|---|
| 帧数 | 28 |
| fps | 7 |
| 时长 | 4.00s |
| 类型 | 单次 |

动作弧线：从趴睡中醒来，睁眼，前腿向前伸，胸口压低，臀部抬起，背部自然拉伸，然后后腿伸展、站起并恢复清醒站姿。适合从睡眠状态切回陪伴状态。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 趴睡 |
| 05 | 睁眼，抬头 |
| 10 | 前腿前伸，胸口低 |
| 14 | 伸懒腰峰值，臀部抬高 |
| 19 | 后腿伸展，身体向前 |
| 24 | 站起 |
| 27 | 清醒站姿 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Sleeping lying pose, eyes closed, head near paws. |
| 01 | Eyes begin to open slightly, ears sleepy. |
| 02 | Head lifts a little from paws, sleepy expression. |
| 03 | Eyes half open, front paws prepare to extend. |
| 04 | Head lifts more, neck lengthens naturally. |
| 05 | Awake but drowsy, head up, ears rising. |
| 06 | Front paws slide forward into stretch pose, chest lowers. |
| 07 | Front legs extend farther forward, elbows straightening. |
| 08 | Chest lowers closer to baseline, hindquarters still low. |
| 09 | Hindquarters begin rising, front paws stretched forward. |
| 10 | Clear play-bow stretch, chest low, front legs long, head forward. |
| 11 | Stretch deepens, back arches gently, hips rising. |
| 12 | Hindquarters high, front paws fully extended, ears awake. |
| 13 | Peak stretch approaches, mouth may open in tiny yawn. |
| 14 | Peak full-body stretch, hips high, chest low, front legs extended. |
| 15 | Hold peak stretch, relaxed yawn expression allowed. |
| 16 | Stretch releases slightly, head lifts. |
| 17 | Hind legs begin stepping forward under body. |
| 18 | Chest rises, front legs still forward but relaxing. |
| 19 | Rear legs extend backward briefly, body lengthened naturally. |
| 20 | Hind legs come under hips, body rises. |
| 21 | Front paws reposition to standing distance. |
| 22 | Almost standing, back line returning to normal. |
| 23 | All paws grounded, body lifting. |
| 24 | Standing but still waking, head slightly low. |
| 25 | Head lifts, ears fully upright. |
| 26 | Awake standing pose, eyes bright. |
| 27 | Stable final standing pose ready for idle. |

### Prompt 附加约束

`{ACTION_ID}` 填 `wake_stretch`，`{ACTION_NAME}` 填 `wake up and full body stretch`。每帧加：`real dog stretching anatomy, front legs extended when specified, hips high at peak, no rubber body distortion`。

### 验收标准

- 睡醒、抬头、前伸、拱背、站起的阶段完整。
- 伸懒腰峰值不能像身体被拉长变形；必须是腿和关节姿态导致的长度变化。
- 可从 `sleep_laze` 自然衔接到该动作。
- 末帧可自然进入 `idle`。

## 动作 12: `sniff_explore` 嗅闻/探索

| 项 | 值 |
|---|---|
| 帧数 | 24 |
| fps | 7 |
| 时长 | 3.43s |
| 类型 | 循环 |

动作弧线：Mochi 低头嗅闻桌面空间，短步慢慢探索。头部贴近地面线，鼻子左右搜索，前爪小步换位，表现真实好奇心。

### 关键帧

| 帧 | 关键姿态 |
|---:|---|
| 00 | 低头准备嗅闻 |
| 05 | 鼻子靠近地面，左前爪小步 |
| 10 | 向左嗅闻 |
| 14 | 回中，换前爪 |
| 18 | 向右嗅闻 |
| 23 | 回到 00 |

### 逐帧姿态指令

| 帧 | `{FRAME_POSE}` |
|---:|---|
| 00 | Curious standing pose with head lowered, nose angled toward baseline. |
| 01 | Nose lowers closer to baseline, ears forward, body calm. |
| 02 | Front shoulders lower slightly, hind legs steady. |
| 03 | Tiny step with one front paw, sniffing starts. |
| 04 | Nose close to baseline, eyes focused downward. |
| 05 | Left front paw steps forward a little, nose tracking the ground. |
| 06 | Nose moves slightly left, ears attentive. |
| 07 | Head low and left, body follows subtly. |
| 08 | Sniffing left, front paws staggered naturally. |
| 09 | Hold low-left sniff, tail relaxed. |
| 10 | Nose at left-most sniff point, shoulders low. |
| 11 | Nose starts returning center, paw prepares to shift. |
| 12 | Head centered low, one paw lifting for tiny exploratory step. |
| 13 | Paw sets down, nose still close to baseline. |
| 14 | Center sniff, body balanced, ears forward. |
| 15 | Nose begins moving right, eyes still downward. |
| 16 | Right front paw makes a small step. |
| 17 | Head low and right, shoulder follows subtly. |
| 18 | Nose at right-most sniff point, curious expression. |
| 19 | Hold right sniff, paws planted. |
| 20 | Nose returns toward center, body stabilizes. |
| 21 | Head slightly lifts but remains sniffing. |
| 22 | Pose close to initial low sniff, ready to loop. |
| 23 | Match frame 00 curious low-head pose for seamless loop. |

### Prompt 附加约束

`{ACTION_ID}` 填 `sniff_explore`，`{ACTION_NAME}` 填 `curious slow sniffing exploration loop`。每帧加：`nose close to ground baseline, small exploratory paw steps, curious but calm, no props, no visible floor`。

### 验收标准

- 头部和鼻子搜索路径清楚，像真实嗅闻。
- 小步换位自然，不像走路循环的重复。
- 00 和 23 可循环。
- 低头时脸部不能丢失 Mochi 特征。

## 资产命名与入库规则

生成完成并通过验收后，推荐按以下结构入库：

```text
public/assets/pets/mochi/motions/{action_id}/{frame_index}.png
```

命名规则：

- `{frame_index}` 使用两位或三位固定宽度，从 `00.png` 开始。
- 同一动作内所有帧尺寸完全一致。
- `manifest.json` 只能登记已经完成逐帧验收的动作。
- 返工只替换未通过的具体帧，不用整体重做动作，除非身份漂移已经影响整组连续性。

## 整体验收

第一批动作包完成时必须满足：

- 12 个动作都是独立生成姿态帧；规划目标 300 张透明 PNG，v1 实际 284 张透明 PNG。
- 所有循环动作首尾衔接自然。
- 所有单次动作能进入和退出 `idle`。
- Mochi 身份在全部动作中稳定，不能看起来像 12 只不同的狗。
- 桌面播放时动作节奏偏慢、真实、陪伴感强，尤其 `walk` 必须保持 3.5 秒左右一圈。
- 没有任何动作依赖运行时压缩、拉伸、翻转、裁肢体、骨骼 rig 或图像变形。
