from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, Sequence

from PIL import Image, ImageDraw


IMAGE_EXTENSIONS = {".png", ".webp", ".tif", ".tiff"}
DEFAULT_CANVAS_SIZE = 560
DEFAULT_BASELINE_Y = 520


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def parse_hex_color(value: str) -> tuple[int, int, int]:
    text = value.strip()
    if text.startswith("#"):
        text = text[1:]
    if len(text) != 6:
        raise ValueError(f"Expected a 6-digit hex color, got: {value}")
    return int(text[0:2], 16), int(text[2:4], 16), int(text[4:6], 16)


def numeric_sort_key(path: Path) -> tuple[tuple[object, ...], str]:
    parts: list[object] = []
    for part in re.findall(r"\d+|\D+", path.stem):
        parts.append(int(part) if part.isdigit() else part.lower())
    return tuple(parts), path.name.lower()


def is_preview_artifact(path: Path) -> bool:
    stem = path.stem.lower()
    return (
        stem in {"preview", "contact_sheet", "sheet"}
        or stem.endswith("-preview")
        or stem.endswith("-sheet")
        or stem.endswith("_preview")
        or stem.endswith("_sheet")
    )


def list_frame_paths(action_dir: Path, pattern: str = "*.png") -> list[Path]:
    paths = [
        path
        for path in action_dir.glob(pattern)
        if path.is_file()
        and path.suffix.lower() in IMAGE_EXTENSIONS
        and not is_preview_artifact(path)
    ]
    return sorted(paths, key=numeric_sort_key)


def alpha_bbox(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A") if image.mode == "RGBA" else image.convert("RGBA").getchannel("A")
    mask = alpha.point(lambda value: 255 if value > threshold else 0)
    return mask.getbbox()


def make_checkerboard(
    size: tuple[int, int],
    square: int = 16,
    colors: Sequence[tuple[int, int, int]] = ((235, 238, 242), (205, 211, 220)),
) -> Image.Image:
    width, height = size
    board = Image.new("RGBA", size, colors[0] + (255,))
    draw = ImageDraw.Draw(board)
    for y in range(0, height, square):
        for x in range(0, width, square):
            index = ((x // square) + (y // square)) % 2
            if index:
                draw.rectangle(
                    (x, y, min(x + square, width), min(y + square, height)),
                    fill=colors[1] + (255,),
                )
    return board


def composite_on_checker(image: Image.Image, square: int = 16) -> Image.Image:
    rgba = image.convert("RGBA")
    base = make_checkerboard(rgba.size, square=square)
    base.alpha_composite(rgba)
    return base


def fit_within(image: Image.Image, max_size: int) -> Image.Image:
    if image.width <= max_size and image.height <= max_size:
        return image.copy()
    scale = min(max_size / image.width, max_size / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)


def normalize_frame_name(frame_index: int, digits: int = 3) -> str:
    if frame_index < 0:
        raise ValueError("frame_index must be non-negative")
    return f"{frame_index:0{digits}d}.png"


def iter_manifest_motions(manifest: dict) -> Iterable[tuple[str, dict]]:
    motions = manifest.get("motions")
    if isinstance(motions, dict):
        for motion_id, motion in motions.items():
            if isinstance(motion, dict):
                yield str(motion_id), motion
        return

    if isinstance(motions, list):
        for index, motion in enumerate(motions):
            if isinstance(motion, dict):
                motion_id = str(motion.get("id") or motion.get("motion_id") or f"motion_{index}")
                yield motion_id, motion
        return

    if isinstance(manifest.get("frames"), list):
        motion_id = str(manifest.get("id") or manifest.get("motion_id") or "motion")
        yield motion_id, manifest

