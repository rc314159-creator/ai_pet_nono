#!/usr/bin/env python3
"""Normalize generated accessory image-edit frames for the desktop pet runtime."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from scipy import ndimage
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT.parent / "reports" / "outfit-generation-batch" / "full-run-2026-05-30"
DEFAULT_OUTPUT = ROOT / "public" / "assets" / "pets" / "mochi" / "image-edited-outfits"
ACCESSORIES = ("acc-gps", "acc-bell", "acc-medal")
TARGET_SIZE = (560, 560)


def expected_frame_count() -> int:
    manifest = json.loads((ROOT / "public" / "assets" / "pets" / "mochi" / "motions" / "manifest.json").read_text(encoding="utf-8"))
    return sum(len(motion["frames"]) for motion in manifest["motions"].values())


def clear_edge_connected_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = np.array(rgba)
    rgb = data[:, :, :3].astype(np.int16)
    alpha = data[:, :, 3]
    channel_spread = rgb.max(axis=2) - rgb.min(axis=2)
    light_neutral = (rgb.min(axis=2) >= 214) & (channel_spread <= 22)
    background_mask = (alpha == 0) | light_neutral
    seeds = np.zeros(background_mask.shape, dtype=bool)
    seeds[0, :] = background_mask[0, :]
    seeds[-1, :] = background_mask[-1, :]
    seeds[:, 0] = background_mask[:, 0]
    seeds[:, -1] = background_mask[:, -1]
    connected_background = ndimage.binary_propagation(seeds, mask=background_mask)
    data[connected_background, :3] = 255
    data[connected_background, 3] = 0
    return Image.fromarray(data, "RGBA")


def normalize_frame(src: Path, dst: Path) -> None:
    image = Image.open(src)
    normalized = clear_edge_connected_background(image).resize(TARGET_SIZE, Image.Resampling.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    normalized.save(dst)


def normalize_accessory(accessory: str, input_root: Path, output_root: Path, expected_count: int) -> dict[str, object]:
    src_root = input_root / accessory
    dst_root = output_root / accessory
    frames = sorted(src_root.glob("motions/**/*.png"))
    written: list[str] = []

    for frame in frames:
        rel = frame.relative_to(src_root)
        normalize_frame(frame, dst_root / rel)
        written.append(str(rel))

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": str(src_root),
        "method": "image-edit-full-frame-background-normalization",
        "targetSize": TARGET_SIZE,
        "accessory": accessory,
        "frameCount": len(written),
        "expectedFrameCount": expected_count,
        "complete": len(written) == expected_count,
        "frames": written,
    }
    dst_root.mkdir(parents=True, exist_ok=True)
    (dst_root / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--accessory", choices=ACCESSORIES)
    args = parser.parse_args()

    accessories = (args.accessory,) if args.accessory else ACCESSORIES
    expected_count = expected_frame_count()
    manifests = [normalize_accessory(accessory, args.input, args.output, expected_count) for accessory in accessories]
    print(json.dumps({item["accessory"]: item["frameCount"] for item in manifests}, ensure_ascii=False))


if __name__ == "__main__":
    main()
