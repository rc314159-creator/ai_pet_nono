#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from common import composite_on_checker, ensure_parent, fit_within, list_frame_paths, make_checkerboard, parse_hex_color


def render_gif(frames: list[Path], output: Path, fps: float, preview_size: int, checker_square: int) -> None:
    duration_ms = max(1, round(1000 / fps))
    rendered: list[Image.Image] = []
    for path in frames:
        image = Image.open(path).convert("RGBA")
        image = fit_within(image, preview_size)
        rendered.append(composite_on_checker(image, square=checker_square).convert("RGB"))

    ensure_parent(output)
    rendered[0].save(
        output,
        save_all=True,
        append_images=rendered[1:],
        duration=duration_ms,
        loop=0,
        optimize=True,
    )


def render_contact_sheet(
    frames: list[Path],
    output: Path,
    columns: int,
    cell_size: int,
    checker_square: int,
    label_height: int,
) -> None:
    columns = max(1, columns)
    rows = (len(frames) + columns - 1) // columns
    width = columns * cell_size
    height = rows * (cell_size + label_height)
    sheet = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()

    for index, path in enumerate(frames):
        col = index % columns
        row = index // columns
        x = col * cell_size
        y = row * (cell_size + label_height)

        tile = make_checkerboard((cell_size, cell_size), square=checker_square)
        image = Image.open(path).convert("RGBA")
        thumbnail = fit_within(image, cell_size - 16)
        tile.alpha_composite(thumbnail, ((cell_size - thumbnail.width) // 2, (cell_size - thumbnail.height) // 2))
        sheet.alpha_composite(tile, (x, y))
        draw.rectangle((x, y, x + cell_size - 1, y + cell_size + label_height - 1), outline=(203, 213, 225, 255))
        draw.text((x + 8, y + cell_size + 6), f"{index:03d}  {path.name}", fill=(15, 23, 42, 255), font=font)

    ensure_parent(output)
    sheet.convert("RGBA").save(output)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Render a motion frame directory into a preview GIF and contact sheet.")
    parser.add_argument("action_dir", type=Path, help="Directory containing normalized RGBA PNG frames.")
    parser.add_argument("--glob", default="*.png", help="Frame filename glob, default: *.png")
    parser.add_argument("--gif", type=Path, help="Output GIF path. Defaults to <action_dir>/<action>-preview.gif.")
    parser.add_argument("--sheet", type=Path, help="Output contact sheet path. Defaults to <action_dir>/<action>-sheet.png.")
    parser.add_argument("--fps", type=float, default=8.0)
    parser.add_argument("--preview-size", type=int, default=320)
    parser.add_argument("--columns", type=int, default=5)
    parser.add_argument("--cell-size", type=int, default=180)
    parser.add_argument("--checker-square", type=int, default=12)
    parser.add_argument("--background", default="#f8fafc", help="Reserved for future solid-background previews.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if not args.action_dir.exists():
        raise FileNotFoundError(args.action_dir)
    if args.fps <= 0:
        raise ValueError("--fps must be greater than 0")

    parse_hex_color(args.background)
    frames = list_frame_paths(args.action_dir, args.glob)
    if not frames:
        raise ValueError(f"No frame images found in {args.action_dir}")

    gif_path = args.gif or (args.action_dir / f"{args.action_dir.name}-preview.gif")
    sheet_path = args.sheet or (args.action_dir / f"{args.action_dir.name}-sheet.png")
    render_gif(frames, gif_path, args.fps, args.preview_size, args.checker_square)
    render_contact_sheet(frames, sheet_path, args.columns, args.cell_size, args.checker_square, label_height=24)

    print(
        json.dumps(
            {
                "action_dir": str(args.action_dir),
                "frame_count": len(frames),
                "gif": str(gif_path),
                "contact_sheet": str(sheet_path),
                "fps": args.fps,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

