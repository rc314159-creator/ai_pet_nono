#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Extract separated chroma-key pose-board subjects into normalized RGBA frames.")
    parser.add_argument("source", type=Path, help="Pose-board image with separated subjects on green background.")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--start-index", type=int, default=0)
    parser.add_argument("--expected-count", type=int, required=True)
    parser.add_argument("--digits", type=int, default=2)
    parser.add_argument("--canvas-size", type=int, default=560)
    parser.add_argument("--target-height", type=int, default=430)
    parser.add_argument("--baseline-y", type=int, default=520)
    parser.add_argument("--min-area", type=int, default=4000)
    parser.add_argument("--green-threshold", type=int, default=90)
    parser.add_argument("--green-ratio", type=float, default=1.14)
    parser.add_argument("--json", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    bgr = cv2.imread(str(args.source), cv2.IMREAD_COLOR)
    if bgr is None:
        raise FileNotFoundError(args.source)

    blue, green, red = cv2.split(bgr)
    bg = (
        (green > args.green_threshold)
        & (green > red * args.green_ratio)
        & (green > blue * args.green_ratio)
    )
    foreground = (~bg).astype(np.uint8) * 255
    foreground = cv2.morphologyEx(foreground, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8), iterations=1)

    count, labels, stats, centroids = cv2.connectedComponentsWithStats(foreground, 8)
    components: list[tuple[int, int, int, int, int, int, float]] = []
    for label in range(1, count):
        x, y, width, height, area = stats[label]
        if area >= args.min_area:
            components.append((label, int(x), int(y), int(width), int(height), int(area), float(centroids[label][0])))
    components.sort(key=lambda item: item[-1])

    if len(components) != args.expected_count:
        raise ValueError(f"Expected {args.expected_count} subjects, found {len(components)}")

    base = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGBA))
    outputs: list[dict] = []

    for offset, (label, x, y, width, height, area, center_x) in enumerate(components):
        frame_index = args.start_index + offset
        mask = (labels == label).astype(np.uint8) * 255
        pad = 10
        left = max(0, x - pad)
        top = max(0, y - pad)
        right = min(base.width, x + width + pad)
        bottom = min(base.height, y + height + pad)

        crop = base.crop((left, top, right, bottom)).convert("RGBA")
        alpha = Image.fromarray(mask[top:bottom, left:right], mode="L").filter(ImageFilter.GaussianBlur(0.35))
        crop.putalpha(alpha)
        crop = despill_green(crop)

        scale = args.target_height / crop.height
        resized = crop.resize((max(1, round(crop.width * scale)), args.target_height), Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", (args.canvas_size, args.canvas_size), (0, 0, 0, 0))
        paste_x = (args.canvas_size - resized.width) // 2
        paste_y = args.baseline_y - resized.height
        frame.alpha_composite(resized, (paste_x, paste_y))

        output = args.output_dir / f"{frame_index:0{args.digits}d}.png"
        frame.save(output)
        outputs.append(
            {
                "frame": frame_index,
                "output": str(output),
                "source_bbox": [x, y, x + width, y + height],
                "area": area,
                "center_x": center_x,
                "paste_xy": [paste_x, paste_y],
            }
        )

    if args.json:
        print(json.dumps({"source": str(args.source), "outputs": outputs}, ensure_ascii=False, indent=2))
    else:
        print(f"Extracted {len(outputs)} frames from {args.source} to {args.output_dir}")
    return 0


def despill_green(image: Image.Image) -> Image.Image:
    array = np.array(image)
    red = array[:, :, 0].astype(np.int16)
    green = array[:, :, 1].astype(np.int16)
    blue = array[:, :, 2].astype(np.int16)
    alpha = array[:, :, 3]
    spill = (alpha > 0) & (green > red * 1.03) & (green > blue * 1.03)
    array[:, :, 1] = np.where(spill, np.maximum(red, blue), green).astype(np.uint8)
    return Image.fromarray(array, "RGBA")


if __name__ == "__main__":
    raise SystemExit(main())
