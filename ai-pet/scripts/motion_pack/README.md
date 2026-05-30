# Motion Pack Tools

这个目录只放逐帧动作素材处理工具，用来把一张张生成出来的绿幕狗狗姿态图整理成桌宠可播放的透明帧、预览 GIF、contact sheet，并校验 manifest。

## 1. 单帧归一化

```bash
python3 scripts/motion_pack/normalize_frame.py \
  /path/to/source/walk_000_green.png \
  --motion-id walk \
  --frame-index 0 \
  --output-dir /tmp/mochi_motion/walk
```

默认输出 `/tmp/mochi_motion/walk/000.png`。处理步骤：

- 去绿幕背景。
- 只保留最大宠物主体，过滤零散噪点。
- 清理主体边缘绿边。
- 放到 `560x560` RGBA 透明画布。
- 将脚底统一贴到 `baseline-y=520`。

常用参数：

```bash
--target-height 430     # 主体标准高度
--baseline-y 520        # 统一脚底基线
--green-threshold 80    # 绿幕亮度阈值
--green-delta 28        # G 相对 R/B 的优势阈值
--softness 46           # 绿幕边缘软化范围
--digits 3              # 输出文件名位数，例如 000.png
```

## 2. 渲染预览

```bash
python3 scripts/motion_pack/render_preview.py \
  /tmp/mochi_motion/walk \
  --fps 8 \
  --gif /tmp/mochi_motion/walk-preview.gif \
  --sheet /tmp/mochi_motion/walk-sheet.png
```

输出：

- GIF：用于快速看动作节奏和连贯性。
- contact sheet：用于逐帧检查姿态、尺寸、脚底基线和抠图边缘。

## 3. 姿态板拆帧

当图像生成模型用一张横向姿态板保持同一只狗和同一镜头时，用这个脚本把姿态板里相互分离的狗拆成连续透明帧。脚本只做主体分割、去绿边、统一尺寸和脚底基线，不做身体压缩、拉伸或动作变形。

```bash
python3 scripts/motion_pack/extract_pose_board.py \
  public/assets/pets/mochi/motion-sources/walk-v2/pose-board-a.png \
  --output-dir public/assets/pets/mochi/motions/walk-v2 \
  --start-index 0 \
  --expected-count 7 \
  --digits 2
```

## 4. 校验动作包

```bash
python3 scripts/motion_pack/validate_motion_pack.py \
  /tmp/mochi_motion/manifest.json
```

检查内容：

- manifest 中声明的帧数和实际 `frames` 数量一致。
- 每个帧文件都存在。
- 每个帧是 RGBA。
- 每个帧有透明背景和可见主体 bbox。
- 所有帧尺寸一致。
- 脚底 bbox 基线漂移过大时给出 warning。

支持的 manifest 结构：

```json
{
  "motions": {
    "walk": {
      "frameCount": 28,
      "fps": 8,
      "loop": true,
      "frames": [
        "walk/000.png",
        "walk/001.png"
      ]
    }
  }
}
```

也支持 `motions` 为数组，或单动作 manifest 中直接包含 `frames`。
