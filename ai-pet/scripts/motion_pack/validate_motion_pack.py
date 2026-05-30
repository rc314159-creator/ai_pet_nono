#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from PIL import Image

from common import alpha_bbox, iter_manifest_motions


COUNT_KEYS = ("frameCount", "frame_count", "framesCount", "frames_count", "count")


def extract_frames(motion: dict[str, Any]) -> list[str]:
    raw_frames = motion.get("frames")
    if not isinstance(raw_frames, list):
        return []

    frames: list[str] = []
    for frame in raw_frames:
        if isinstance(frame, str):
            frames.append(frame)
        elif isinstance(frame, dict):
            value = frame.get("file") or frame.get("path") or frame.get("src")
            if isinstance(value, str):
                frames.append(value)
    return frames


def expected_count(motion: dict[str, Any]) -> int | None:
    for key in COUNT_KEYS:
        value = motion.get(key)
        if isinstance(value, int):
            return value
    return None


def resolve_frame_path(base_dir: Path, motion_id: str, frame: str) -> Path:
    path = Path(frame)
    if path.is_absolute():
        return path
    candidates = [
        base_dir / path,
        base_dir / motion_id / path,
        base_dir.parent / path,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def validate_image(path: Path, edge_margin: int, alpha_threshold: int) -> tuple[list[str], list[str], dict[str, Any]]:
    errors: list[str] = []
    warnings: list[str] = []
    stats: dict[str, Any] = {"path": str(path)}

    if not path.exists():
        return [f"Missing frame file: {path}"], warnings, stats

    with Image.open(path) as image:
        stats["mode"] = image.mode
        stats["size"] = list(image.size)
        if image.mode != "RGBA":
            errors.append(f"{path}: expected RGBA, got {image.mode}")
            rgba = image.convert("RGBA")
        else:
            rgba = image.copy()

    bbox = alpha_bbox(rgba, threshold=alpha_threshold)
    stats["bbox"] = list(bbox) if bbox else None
    if bbox is None:
        errors.append(f"{path}: no visible transparent bbox subject found")
        return errors, warnings, stats

    width, height = rgba.size
    if bbox == (0, 0, width, height):
        errors.append(f"{path}: alpha bbox fills the whole frame; background is not transparent")

    left, top, right, bottom = bbox
    if left <= edge_margin or top <= edge_margin or right >= width - edge_margin or bottom >= height - edge_margin:
        warnings.append(f"{path}: subject bbox is close to canvas edge: {bbox}")

    stats["baseline_y"] = bottom
    return errors, warnings, stats


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate motion-pack manifest frame paths and normalized RGBA frames.")
    parser.add_argument("manifest", type=Path, help="Motion manifest JSON.")
    parser.add_argument("--base-dir", type=Path, help="Frame base directory. Defaults to manifest parent.")
    parser.add_argument("--motion-id", help="Validate only one motion id.")
    parser.add_argument("--edge-margin", type=int, default=2)
    parser.add_argument("--alpha-threshold", type=int, default=8)
    parser.add_argument("--strict", action="store_true", help="Treat warnings as failures.")
    parser.add_argument("--json", action="store_true", help="Print machine-readable validation details.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if not args.manifest.exists():
        raise FileNotFoundError(args.manifest)

    with args.manifest.open("r", encoding="utf-8") as handle:
        manifest = json.load(handle)

    base_dir = args.base_dir or args.manifest.parent
    all_errors: list[str] = []
    all_warnings: list[str] = []
    details: dict[str, Any] = {"manifest": str(args.manifest), "motions": {}}

    motions = list(iter_manifest_motions(manifest))
    if args.motion_id:
        motions = [(motion_id, motion) for motion_id, motion in motions if motion_id == args.motion_id]
    if not motions:
        all_errors.append("No matching motions found in manifest.")

    for motion_id, motion in motions:
        frames = extract_frames(motion)
        expected = expected_count(motion)
        motion_details: dict[str, Any] = {"expected_count": expected, "actual_count": len(frames), "frames": []}
        details["motions"][motion_id] = motion_details

        if expected is not None and expected != len(frames):
            all_errors.append(f"{motion_id}: expected {expected} frames in manifest, got {len(frames)}")
        if expected is None:
            all_warnings.append(f"{motion_id}: manifest has no frame count field")
        if not frames:
            all_errors.append(f"{motion_id}: no frames listed")
            continue

        baselines: list[int] = []
        sizes: set[tuple[int, int]] = set()
        for frame in frames:
            path = resolve_frame_path(base_dir, motion_id, frame)
            errors, warnings, stats = validate_image(path, args.edge_margin, args.alpha_threshold)
            all_errors.extend(f"{motion_id}: {message}" for message in errors)
            all_warnings.extend(f"{motion_id}: {message}" for message in warnings)
            motion_details["frames"].append(stats)
            if stats.get("baseline_y") is not None:
                baselines.append(int(stats["baseline_y"]))
            if isinstance(stats.get("size"), list) and len(stats["size"]) == 2:
                sizes.add((int(stats["size"][0]), int(stats["size"][1])))

        if len(sizes) > 1:
            all_errors.append(f"{motion_id}: inconsistent frame sizes: {sorted(sizes)}")
        if baselines and max(baselines) - min(baselines) > 4:
            all_warnings.append(f"{motion_id}: baseline drift is {max(baselines) - min(baselines)} px")

    if args.json:
        details["errors"] = all_errors
        details["warnings"] = all_warnings
        print(json.dumps(details, ensure_ascii=False, indent=2))
    else:
        print(f"Validated manifest: {args.manifest}")
        print(f"Motions: {len(motions)}")
        print(f"Errors: {len(all_errors)}")
        for message in all_errors:
            print(f"ERROR: {message}")
        print(f"Warnings: {len(all_warnings)}")
        for message in all_warnings:
            print(f"WARN: {message}")

    if all_errors or (args.strict and all_warnings):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
