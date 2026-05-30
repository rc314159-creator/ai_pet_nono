#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

from common import (
    DEFAULT_BASELINE_Y,
    DEFAULT_CANVAS_SIZE,
    alpha_bbox,
    ensure_parent,
    normalize_frame_name,
)


def _largest_component_with_cv2(mask: np.ndarray) -> np.ndarray | None:
    try:
        import cv2  # type: ignore
    except Exception:
        return None

    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype("uint8"), 8)
    if count <= 1:
        return mask
    largest_label = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    return labels == largest_label


def _largest_component_fallback(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    best_pixels: list[tuple[int, int]] = []
    ys, xs = np.nonzero(mask)

    for start_y, start_x in zip(ys.tolist(), xs.tolist()):
        if visited[start_y, start_x]:
            continue

        pixels: list[tuple[int, int]] = []
        queue: deque[tuple[int, int]] = deque([(start_y, start_x)])
        visited[start_y, start_x] = True

        while queue:
            y, x = queue.popleft()
            pixels.append((y, x))
            for ny in (y - 1, y, y + 1):
                if ny < 0 or ny >= height:
                    continue
                for nx in (x - 1, x, x + 1):
                    if nx < 0 or nx >= width or visited[ny, nx] or not mask[ny, nx]:
                        continue
                    visited[ny, nx] = True
                    queue.append((ny, nx))

        if len(pixels) > len(best_pixels):
            best_pixels = pixels

    result = np.zeros_like(mask, dtype=bool)
    if best_pixels:
        yy, xx = zip(*best_pixels)
        result[np.array(yy), np.array(xx)] = True
    return result


def keep_largest_component(mask: np.ndarray) -> np.ndarray:
    cv2_result = _largest_component_with_cv2(mask)
    if cv2_result is not None:
        return cv2_result
    return _largest_component_fallback(mask)


def remove_green_screen(
    image: Image.Image,
    green_threshold: int,
    green_delta: int,
    softness: int,
    alpha_threshold: int,
    edge_radius: int,
    spill_delta: int,
) -> Image.Image:
    rgba = image.convert("RGBA")
    arr = np.array(rgba).astype(np.int16)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3].astype(np.float32)

    red = rgb[:, :, 0]
    green = rgb[:, :, 1]
    blue = rgb[:, :, 2]
    max_rb = np.maximum(red, blue)
    green_score = green - max_rb

    start = max(0, green_delta - softness)
    soft = np.clip((green_score - start) / max(1, softness), 0, 1)
    green_candidate = (green >= green_threshold) & (green_score >= start)
    alpha = np.where(green_candidate, alpha * (1.0 - soft), alpha)
    alpha = np.where(alpha > alpha_threshold, alpha, 0)

    subject_mask = keep_largest_component(alpha > alpha_threshold)
    alpha = np.where(subject_mask, alpha, 0)

    alpha_image = Image.fromarray(np.clip(alpha, 0, 255).astype(np.uint8), "L")
    kernel = max(3, edge_radius * 2 + 1)
    if kernel % 2 == 0:
        kernel += 1
    eroded = np.array(alpha_image.filter(ImageFilter.MinFilter(kernel))) > alpha_threshold
    edge = subject_mask & ~eroded

    spill = edge & (green > (max_rb + spill_delta))
    rgb[:, :, 1] = np.where(spill, np.minimum(green, max_rb + spill_delta), green)
    alpha = np.where(spill & (green_score > green_delta), alpha * 0.88, alpha)

    arr[:, :, :3] = rgb
    arr[:, :, 3] = np.clip(alpha, 0, 255)
    arr[arr[:, :, 3] <= alpha_threshold, :3] = 0
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


def place_on_canvas(
    image: Image.Image,
    canvas_size: int,
    baseline_y: int,
    target_height: int,
    max_width: int,
    x_offset: int,
) -> tuple[Image.Image, dict]:
    bbox = alpha_bbox(image)
    if bbox is None:
        raise ValueError("No non-transparent subject found after green-screen removal.")

    cropped = image.crop(bbox)
    scale = target_height / cropped.height if target_height > 0 else 1.0
    if max_width > 0 and cropped.width * scale > max_width:
        scale = max_width / cropped.width
    if cropped.height * scale > baseline_y:
        scale = baseline_y / cropped.height

    size = (
        max(1, round(cropped.width * scale)),
        max(1, round(cropped.height * scale)),
    )
    normalized = cropped.resize(size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    x = round((canvas_size - normalized.width) / 2 + x_offset)
    y = round(baseline_y - normalized.height)
    x = max(0, min(canvas_size - normalized.width, x))
    y = max(0, min(canvas_size - normalized.height, y))
    canvas.alpha_composite(normalized, (x, y))

    final_bbox = alpha_bbox(canvas)
    return canvas, {
        "source_bbox": bbox,
        "scale": scale,
        "paste_xy": [x, y],
        "final_bbox": final_bbox,
        "baseline_y": baseline_y,
        "canvas_size": canvas_size,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Normalize one green-screen dog pose image into a 560x560 transparent animation frame."
    )
    parser.add_argument("source", type=Path, help="Source green-screen pose image.")
    parser.add_argument("--motion-id", required=True, help="Motion id, for reporting and output grouping.")
    parser.add_argument("--frame-index", required=True, type=int, help="Zero-based frame index.")
    parser.add_argument("--output-dir", required=True, type=Path, help="Directory where the normalized PNG is written.")
    parser.add_argument("--digits", type=int, default=3, help="Zero padding for output frame names.")
    parser.add_argument("--canvas-size", type=int, default=DEFAULT_CANVAS_SIZE)
    parser.add_argument("--baseline-y", type=int, default=DEFAULT_BASELINE_Y)
    parser.add_argument("--target-height", type=int, default=430)
    parser.add_argument("--max-width", type=int, default=520)
    parser.add_argument("--x-offset", type=int, default=0)
    parser.add_argument("--green-threshold", type=int, default=80)
    parser.add_argument("--green-delta", type=int, default=28)
    parser.add_argument("--softness", type=int, default=46)
    parser.add_argument("--alpha-threshold", type=int, default=8)
    parser.add_argument("--edge-radius", type=int, default=2)
    parser.add_argument("--spill-delta", type=int, default=18)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if not args.source.exists():
        raise FileNotFoundError(args.source)

    source = Image.open(args.source)
    keyed = remove_green_screen(
        source,
        green_threshold=args.green_threshold,
        green_delta=args.green_delta,
        softness=args.softness,
        alpha_threshold=args.alpha_threshold,
        edge_radius=args.edge_radius,
        spill_delta=args.spill_delta,
    )
    normalized, stats = place_on_canvas(
        keyed,
        canvas_size=args.canvas_size,
        baseline_y=args.baseline_y,
        target_height=args.target_height,
        max_width=args.max_width,
        x_offset=args.x_offset,
    )

    output_path = args.output_dir / normalize_frame_name(args.frame_index, args.digits)
    ensure_parent(output_path)
    normalized.save(output_path)

    print(
        json.dumps(
            {
                "motion_id": args.motion_id,
                "frame_index": args.frame_index,
                "output": str(output_path),
                **stats,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

