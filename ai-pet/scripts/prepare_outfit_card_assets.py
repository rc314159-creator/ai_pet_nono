#!/usr/bin/env python3
"""Create card thumbnail assets for the outfit selector."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUTPUT = PUBLIC / "assets" / "outfit"
SAMPLES = ROOT.parent / "reports" / "outfit-generation-samples"


def cover(src: Path, dst: Path, size: tuple[int, int] = (360, 240), bg=(248, 244, 239)) -> None:
    image = Image.open(src).convert("RGBA")
    canvas = Image.new("RGBA", size, (*bg, 255))
    image.thumbnail((size[0] - 24, size[1] - 24), Image.Resampling.LANCZOS)
    canvas.alpha_composite(image, ((size[0] - image.width) // 2, (size[1] - image.height) // 2))
    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(dst, quality=92)


def crop_cover(src: Path, dst: Path, size: tuple[int, int] = (360, 240)) -> None:
    image = Image.open(src).convert("RGB")
    src_ratio = image.width / image.height
    dst_ratio = size[0] / size[1]
    if src_ratio > dst_ratio:
        new_width = int(image.height * dst_ratio)
        left = (image.width - new_width) // 2
        image = image.crop((left, 0, left + new_width, image.height))
    else:
        new_height = int(image.width / dst_ratio)
        top = max(0, (image.height - new_height) // 2)
        image = image.crop((0, top, image.width, top + new_height))
    image = image.resize(size, Image.Resampling.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    image.save(dst, quality=92)


def label_card(dst: Path, title: str, fill: tuple[int, int, int], accent: tuple[int, int, int]) -> None:
    size = (360, 240)
    image = Image.new("RGB", size, (248, 244, 239))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((46, 56, 314, 184), radius=34, fill=fill, outline=accent, width=6)
    draw.rounded_rectangle((88, 92, 272, 148), radius=28, fill=(255, 255, 255), outline=accent, width=4)
    draw.text((132, 160), title, fill=(42, 48, 45))
    dst.parent.mkdir(parents=True, exist_ok=True)
    image.save(dst, quality=92)


def accessory_thumb(src: Path, dst: Path, size: tuple[int, int] = (360, 240)) -> None:
    image = Image.open(src).convert("RGB")
    crop = image.crop((95, 0, 315, 220)).resize(size, Image.Resampling.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    crop.save(dst, quality=92)


def main() -> None:
    cover(PUBLIC / "assets/pets/mochi/motions/idle-v1/000.png", OUTPUT / "none.jpg")
    crop_cover(PUBLIC / "assets/community/corgi-leash-grass.jpg", OUTPUT / "trail-vest.jpg")
    cover(PUBLIC / "assets/market/ruffwear-sun-shower.png", OUTPUT / "rain-coat.jpg")
    label_card(OUTPUT / "birthday-bandana.jpg", "birthday", (255, 225, 221), (255, 143, 115))

    cover(PUBLIC / "assets/pets/mochi/wangcai-profile-avatar-v1.png", OUTPUT / "fur-soft.jpg")
    cover(PUBLIC / "assets/pets/mochi/motions/idle-v1/000.png", OUTPUT / "fur-cream.jpg")
    cover(PUBLIC / "assets/pets/mochi/motions/sit-v1/10.png", OUTPUT / "fur-clean.jpg")

    cover(PUBLIC / "assets/pets/mochi/wangcai-profile-avatar-v1.png", OUTPUT / "makeup-bright.jpg")
    label_card(OUTPUT / "makeup-star.jpg", "star", (255, 246, 219), (226, 166, 64))
    cover(PUBLIC / "assets/pets/mochi/motions/sleep-laze-v1/010.png", OUTPUT / "makeup-calm.jpg")

    cover(SAMPLES / "idle-000-acc-gps-edit.png", OUTPUT / "acc-gps.jpg")
    cover(SAMPLES / "idle-000-acc-bell-edit.png", OUTPUT / "acc-bell.jpg")
    cover(SAMPLES / "idle-000-acc-medal-edit.png", OUTPUT / "acc-medal.jpg")
    accessory_thumb(OUTPUT / "acc-gps.jpg", OUTPUT / "acc-gps-thumb.jpg")
    accessory_thumb(OUTPUT / "acc-bell.jpg", OUTPUT / "acc-bell-thumb.jpg")
    accessory_thumb(OUTPUT / "acc-medal.jpg", OUTPUT / "acc-medal-thumb.jpg")

    print(f"wrote outfit thumbnails to {OUTPUT}")


if __name__ == "__main__":
    main()
